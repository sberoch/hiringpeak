import { normalizeForMatch } from './vacancy-ai.matcher';
import type { IdCatalogOption } from './vacancy-ai.matcher';

/** Ordered from highest to lowest seniority. */
export const SENIORITY_BANDS = [
  'executive',
  'director',
  'manager',
  'lead',
  'mid',
  'junior',
  'entry',
] as const;

export type SeniorityBand = (typeof SENIORITY_BANDS)[number];

const BAND_RANK = new Map<SeniorityBand, number>(
  SENIORITY_BANDS.map((band, index) => [band, index]),
);

const ROLE_BAND_RULES: Array<{ band: SeniorityBand; patterns: RegExp[] }> = [
  {
    band: 'executive',
    patterns: [
      /\b(ceo|cfo|cto|cmo|coo|cpo|chro|cso|chief\s+\w+\s+officer)\b/i,
      /\b(presidente|vicepresidente|vp\s+|managing\s+director|socio\s+director)\b/i,
      /\b(fundador|co-?founder|owner\s+operator)\b/i,
      /\b(directorio|board|comite\s+ejecutivo|comite\s+de\s+direccion)\b/i,
    ],
  },
  {
    band: 'director',
    patterns: [
      /\b(director[a]?\s+(general|comercial|de\s+\w+|regional)?|head\s+of)\b/i,
      /\b(director[a]?)\b/i,
      /\b(reporta(?:ra|rá|r[áa])?\s+(?:al|a la)\s+(?:ceo|presidencia|directorio))\b/i,
      /\b(estrategia\s+(?:regional|corporativa|de\s+negocio))\b/i,
    ],
  },
  {
    band: 'manager',
    patterns: [
      /\b(gerente|general\s+manager|country\s+manager|business\s+manager)\b/i,
      /\b(manager|jefe[a]?\s+(de\s+)?(area|equipo|zona|regional)?)\b/i,
      /\b(supervisor[a]?|encargad[oa])\b/i,
      /\b(liderar\s+equipos?|manejo\s+de\s+equipo|personas\s+a\s+cargo)\b/i,
      /\b(responsable\s+(?:de|por)\s+(?:la\s+)?(?:operacion|operaci[oó]n|area|unidad|negocio))\b/i,
    ],
  },
  {
    band: 'lead',
    patterns: [
      /\b(team\s*lead|tech\s*lead|l[ií]der\s+(de\s+)?(equipo|proyecto|tecnico))\b/i,
      /\b(coordinador[a]?(\s+senior)?|coordinator)\b/i,
      /\b(referente|owner\s+de\s+\w+)\b/i,
    ],
  },
  {
    band: 'mid',
    patterns: [
      /\b(analista(\s+senior)?|especialista|consultor[a]?|profesional\s+de)\b/i,
      /\b(asistente\s+ejecutiv[oa]|executive\s+assistant)\b/i,
      /\b(\d+\+?\s*a[nñ]os\s+de\s+experiencia)\b/i,
      /\b(ssr|semi\s*senior|semisenior)\b/i,
    ],
  },
  {
    band: 'junior',
    patterns: [
      /\b(junior|jr\.?|semi\s+junior|associate|becari[oa])\b/i,
      /\b(0\s*[-–]\s*2\s*a[nñ]os|1\s*[-–]\s*3\s*a[nñ]os)\b/i,
    ],
  },
  {
    band: 'entry',
    patterns: [
      /\b(data\s*entry|carga\s+de\s+datos|digitador[a]?|ingreso\s+de\s+datos)\b/i,
      /\b(trainee|pasante|practicante|pasant[ií]a|intern\b)\b/i,
      /\b(auxiliar\s+administrativ[oa]|administrativ[oa]\s+junior|recepcionista)\b/i,
      /\b(operari[oa]\s+b[aá]sic[oa]|sin\s+experiencia|primer\s+empleo)\b/i,
      /\b(asistente(?!\s+ejecutiv))\b/i,
    ],
  },
];

function catalogBandsForName(name: string): SeniorityBand[] {
  const normalized = normalizeForMatch(name);
  const bands = new Set<SeniorityBand>();

  if (/\bceo\b/.test(normalized) || normalized === 'ceo') {
    bands.add('executive');
  }

  if (/director/.test(normalized)) {
    bands.add('director');
    bands.add('executive');
  }

  if (/gerente/.test(normalized)) {
    bands.add('manager');
    bands.add('director');
  }

  if (/jefe|lider|líder|team/.test(normalized)) {
    bands.add('lead');
    bands.add('manager');
  }

  if (/asistente/.test(normalized)) {
    if (/ejecutiv/.test(normalized)) {
      bands.add('mid');
    } else {
      bands.add('entry');
      bands.add('mid');
    }
  }

  if (/junior|jr\b|trainee|pasante|practicante|entry/.test(normalized)) {
    bands.add('junior');
    bands.add('entry');
  }

  if (bands.size === 0) {
    bands.add('mid');
  }

  return [...bands];
}

function bandDistance(left: SeniorityBand, right: SeniorityBand) {
  return Math.abs(BAND_RANK.get(left)! - BAND_RANK.get(right)!);
}

function extractMaxYearsOfExperience(text: string) {
  const matches = Array.from(
    text.matchAll(/(\d{1,2})\s*\+?\s*a[nñ]os?\s+de\s+experiencia/gi),
  );
  const years = matches
    .map((match) => Number.parseInt(match[1] ?? '', 10))
    .filter((value) => Number.isFinite(value));

  if (years.length === 0) {
    return null;
  }

  return Math.max(...years);
}

/** Infer the seniority band implied by role/title text (highest match wins). */
export function inferSeniorityBandFromText(text: string): SeniorityBand | null {
  const normalized = normalizeForMatch(text);

  if (normalized.length === 0) {
    return null;
  }

  let bestBand: SeniorityBand | null = null;
  let bestRank = Number.POSITIVE_INFINITY;
  const experienceYears = extractMaxYearsOfExperience(normalized);
  const hasLeadershipSignals =
    /\b(liderar|liderazgo|equipo\s+a\s+cargo|personas\s+a\s+cargo|manejo\s+de\s+equipo|coordinar)\b/i.test(
      normalized,
    );
  const hasStrategicSignals =
    /\b(estrategia|planificacion|planificaci[oó]n|roadmap|presupuesto|p&l|unidad\s+de\s+negocio)\b/i.test(
      normalized,
    );
  const hasBroadExperienceSignals =
    /\b(vasta|amplia|solida|s[oó]lida|fuerte)\s+(experiencia|trayectoria)\b/i.test(
      normalized,
    );

  for (const rule of ROLE_BAND_RULES) {
    const matched = rule.patterns.some((pattern) => pattern.test(normalized));

    if (!matched) {
      continue;
    }

    const rank = BAND_RANK.get(rule.band)!;

    if (rank < bestRank) {
      bestRank = rank;
      bestBand = rule.band;
    }
  }

  if (
    bestBand == null &&
    hasBroadExperienceSignals &&
    (hasLeadershipSignals || hasStrategicSignals)
  ) {
    return 'manager';
  }

  if (bestBand == null && hasLeadershipSignals && hasStrategicSignals) {
    return 'manager';
  }

  if (experienceYears != null) {
    if (experienceYears >= 12 && (hasLeadershipSignals || hasStrategicSignals)) {
      if (
        bestBand == null ||
        BAND_RANK.get(bestBand)! > BAND_RANK.get('director')!
      ) {
        return 'director';
      }

      return bestBand;
    }

    if (experienceYears >= 8 && hasLeadershipSignals) {
      if (
        bestBand == null ||
        BAND_RANK.get(bestBand)! > BAND_RANK.get('manager')!
      ) {
        return 'manager';
      }

      return bestBand;
    }

    if (bestBand == null && experienceYears >= 5) {
      return 'mid';
    }

    if (bestBand == null && experienceYears >= 2) {
      return 'junior';
    }
  }

  return bestBand;
}

/** Map inferred band to catalog ids (closest names in the org catalog). */
export function resolveSeniorityIdsFromBand(
  band: SeniorityBand,
  catalog: IdCatalogOption[],
  maxIds = 1,
): number[] | undefined {
  if (catalog.length === 0) {
    return undefined;
  }

  const scored = catalog
    .map((item) => {
      const itemBands = catalogBandsForName(item.name);
      const distance = Math.min(
        ...itemBands.map((itemBand) => bandDistance(band, itemBand)),
      );
      const primaryBand = itemBands[0]!;

      return { id: item.id, distance, name: item.name, primaryBand };
    })
    .sort((left, right) => {
      if (left.distance !== right.distance) {
        return left.distance - right.distance;
      }

      const leftPrimaryMatch = left.primaryBand === band ? 0 : 1;
      const rightPrimaryMatch = right.primaryBand === band ? 0 : 1;

      if (leftPrimaryMatch !== rightPrimaryMatch) {
        return leftPrimaryMatch - rightPrimaryMatch;
      }

      return left.name.localeCompare(right.name, 'es');
    });

  const selected = scored.slice(0, maxIds).map((item) => item.id);

  return selected.length > 0 ? selected : undefined;
}

export function resolveSeniorityIdsFromInference(
  text: string,
  catalog: IdCatalogOption[],
): number[] | undefined {
  const band = inferSeniorityBandFromText(text);

  if (!band) {
    return undefined;
  }

  return resolveSeniorityIdsFromBand(band, catalog);
}
