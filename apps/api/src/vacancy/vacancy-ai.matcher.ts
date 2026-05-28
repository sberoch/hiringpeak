interface SearchableLabel<TValue> {
  label: string;
  normalized: string;
  value: TValue;
}

export interface IdCatalogOption {
  id: number;
  name: string;
}

export interface StringCatalogOption {
  value: string;
}

export interface IdCatalogMatch {
  id: number;
  label: string;
  score: number;
  autoSelectable: boolean;
}

export interface StringCatalogMatch {
  value: string;
  label: string;
  score: number;
  autoSelectable: boolean;
}

interface SearchOptions {
  autoSelectThreshold: number;
  minimumScore: number;
  limit?: number;
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeForMatch(value: string) {
  return collapseWhitespace(
    value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase(),
  );
}

function damerauLevenshteinDistance(source: string, target: string) {
  const sourceLength = source.length;
  const targetLength = target.length;

  if (sourceLength === 0) return targetLength;
  if (targetLength === 0) return sourceLength;

  const matrix = Array.from({ length: sourceLength + 1 }, () =>
    Array.from({ length: targetLength + 1 }, () => 0),
  );

  for (let i = 0; i <= sourceLength; i += 1) {
    matrix[i]![0] = i;
  }

  for (let j = 0; j <= targetLength; j += 1) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= sourceLength; i += 1) {
    for (let j = 1; j <= targetLength; j += 1) {
      const substitutionCost = source[i - 1] === target[j - 1] ? 0 : 1;

      const deletion = matrix[i - 1]![j]! + 1;
      const insertion = matrix[i]![j - 1]! + 1;
      const substitution = matrix[i - 1]![j - 1]! + substitutionCost;

      let current = Math.min(deletion, insertion, substitution);

      if (
        i > 1 &&
        j > 1 &&
        source[i - 1] === target[j - 2] &&
        source[i - 2] === target[j - 1]
      ) {
        const transposition = matrix[i - 2]![j - 2]! + substitutionCost;
        current = Math.min(current, transposition);
      }

      matrix[i]![j] = current;
    }
  }

  return matrix[sourceLength]![targetLength]!;
}

function buildTokens(value: string) {
  return normalizeForMatch(value).split(' ').filter(Boolean);
}

function calculateTokenOverlapScore(query: string, candidate: string) {
  const queryTokens = buildTokens(query);
  const candidateTokens = buildTokens(candidate);

  if (queryTokens.length === 0 || candidateTokens.length === 0) {
    return 0;
  }

  const candidateTokenSet = new Set(candidateTokens);
  let overlapCount = 0;

  for (const token of queryTokens) {
    if (candidateTokenSet.has(token)) {
      overlapCount += 1;
    }
  }

  return overlapCount / Math.max(queryTokens.length, candidateTokens.length);
}

function calculateDistanceScore(query: string, candidate: string) {
  const normalizedQuery = normalizeForMatch(query);
  const normalizedCandidate = normalizeForMatch(candidate);
  const maxLength = Math.max(
    normalizedQuery.length,
    normalizedCandidate.length,
  );

  if (maxLength === 0) {
    return 1;
  }

  const distance = damerauLevenshteinDistance(
    normalizedQuery,
    normalizedCandidate,
  );

  return 1 - distance / maxLength;
}

function calculateSubstringScore(query: string, candidate: string) {
  const normalizedQuery = normalizeForMatch(query);
  const normalizedCandidate = normalizeForMatch(candidate);

  if (normalizedQuery.length === 0 || normalizedCandidate.length === 0) {
    return 0;
  }

  if (normalizedQuery === normalizedCandidate) {
    return 1;
  }

  if (
    normalizedCandidate.includes(normalizedQuery) ||
    normalizedQuery.includes(normalizedCandidate)
  ) {
    const shortestLength = Math.min(
      normalizedQuery.length,
      normalizedCandidate.length,
    );
    const longestLength = Math.max(
      normalizedQuery.length,
      normalizedCandidate.length,
    );

    return 0.82 + shortestLength / (longestLength * 10);
  }

  return 0;
}

function calculateScore(query: string, candidate: string) {
  const substringScore = calculateSubstringScore(query, candidate);
  const tokenOverlapScore = calculateTokenOverlapScore(query, candidate);
  const distanceScore = calculateDistanceScore(query, candidate);

  return Math.max(
    substringScore,
    tokenOverlapScore * 0.9,
    distanceScore * 0.85,
  );
}

function searchLabels<TValue>(
  query: string,
  labels: Array<SearchableLabel<TValue>>,
  options: SearchOptions,
) {
  const normalizedQuery = normalizeForMatch(query);

  if (normalizedQuery.length === 0) {
    return [];
  }

  const results = labels
    .map((label) => {
      const score = calculateScore(normalizedQuery, label.normalized);

      return {
        label,
        score,
      };
    })
    .filter((result) => result.score >= options.minimumScore)
    .sort((left, right) => right.score - left.score)
    .slice(0, options.limit ?? 5);

  return results;
}

export function searchIdCatalog(
  query: string,
  options: IdCatalogOption[],
  searchOptions: SearchOptions,
) {
  const searchableOptions = options.map((option) => ({
    label: option.name,
    normalized: option.name,
    value: option.id,
  }));

  return searchLabels(query, searchableOptions, searchOptions).map((result) => ({
    id: result.label.value,
    label: result.label.label,
    score: Number(result.score.toFixed(4)),
    autoSelectable: result.score >= searchOptions.autoSelectThreshold,
  }));
}

export function searchStringCatalog(
  query: string,
  options: StringCatalogOption[],
  searchOptions: SearchOptions,
) {
  const searchableOptions = options.map((option) => ({
    label: option.value,
    normalized: option.value,
    value: option.value,
  }));

  return searchLabels(query, searchableOptions, searchOptions).map((result) => ({
    value: result.label.value,
    label: result.label.label,
    score: Number(result.score.toFixed(4)),
    autoSelectable: result.score >= searchOptions.autoSelectThreshold,
  }));
}

