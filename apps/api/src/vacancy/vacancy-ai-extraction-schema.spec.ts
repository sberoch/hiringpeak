import { describe, expect, it } from 'vitest';
import {
  LLM_EXTRACTION_RESULT_SCHEMA,
  toAiVacancyDraft,
  toExtractionMetadata,
} from './vacancy-ai-extraction-schema';

describe('LLM_EXTRACTION_RESULT_SCHEMA', () => {
  it('accepts null for every optional field (real model output shape)', () => {
    // Mirrors the Volkswagen COO PDF output that broke AiVacancyDraftSchema:
    // the model emits null instead of omitting unknown fields.
    const parsed = LLM_EXTRACTION_RESULT_SCHEMA.parse({
      draft: {
        title: 'Vicepresidente de Operaciones (COO)',
        description: 'Liderar operaciones industriales.',
        salary: null,
        companyId: null,
        filters: {
          seniorityIds: [21],
          areaIds: [3, 4],
          industryIds: [10],
          minStars: null,
          gender: null,
          minAge: null,
          maxAge: null,
          countries: ['Argentina'],
          provinces: ['Buenos Aires'],
          languages: ['Inglés', 'Alemán'],
        },
      },
      metadata: {
        inferredFields: ['title'],
        unresolvedSignals: ['Volkswagen Argentina'],
      },
    });

    expect(parsed.draft.companyId).toBeNull();
  });

  it('accepts null filters and null metadata', () => {
    const parsed = LLM_EXTRACTION_RESULT_SCHEMA.parse({
      draft: { title: null, description: null, salary: null, companyId: null, filters: null },
      metadata: null,
    });

    expect(parsed.draft.filters).toBeNull();
  });
});

describe('toAiVacancyDraft', () => {
  it('converts nulls to undefined and defaults filters to an object', () => {
    const draft = toAiVacancyDraft({
      title: 'Gerente Comercial',
      description: null,
      salary: null,
      companyId: null,
      filters: null,
    });

    expect(draft).toEqual({
      title: 'Gerente Comercial',
      description: undefined,
      salary: undefined,
      companyId: undefined,
      filters: {
        seniorityIds: undefined,
        areaIds: undefined,
        industryIds: undefined,
        minStars: undefined,
        gender: undefined,
        minAge: undefined,
        maxAge: undefined,
        countries: undefined,
        provinces: undefined,
        languages: undefined,
      },
    });
  });

  it('preserves resolved values', () => {
    const draft = toAiVacancyDraft({
      title: 'COO',
      description: 'desc',
      salary: 'USD 10k',
      companyId: 30,
      filters: { seniorityIds: [21], minStars: 4, countries: ['Argentina'] },
    });

    expect(draft.companyId).toBe(30);
    expect(draft.filters.seniorityIds).toEqual([21]);
    expect(draft.filters.minStars).toBe(4);
    expect(draft.filters.countries).toEqual(['Argentina']);
  });
});

describe('toExtractionMetadata', () => {
  it('defaults null metadata to empty arrays', () => {
    expect(toExtractionMetadata(null)).toEqual({
      inferredFields: [],
      unresolvedSignals: [],
    });
    expect(toExtractionMetadata({ inferredFields: null, unresolvedSignals: ['x'] })).toEqual({
      inferredFields: [],
      unresolvedSignals: ['x'],
    });
  });
});
