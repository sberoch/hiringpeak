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
    ],
  },
  {
    band: 'director',
    patterns: [
      /\b(director[a]?\s+(general|comercial|de\s+\w+|regional)?|head\s+of)\b/i,
      /\b(director[a]?)\b/i,
    ],
  },
  {
    band: 'manager',
    patterns: [
      /\b(gerente|general\s+manager|country\s+manager|business\s+manager)\b/i,
      /\b(manager|jefe[a]?\s+(de\s+)?(area|equipo|zona|regional)?)\b/i,
      /\b(supervisor[a]?|encargad[oa])\b/i,
    ],
  },
  {
    band: 'lead',
    patterns: [
      /\b(team\s*lead|tech\s*lead|l[ií]der\s+(de\s+)?(equipo|proyecto|tecnico))\b/i,
      /\b(coordinador[a]?(\s+senior)?|coordinator)\b/i,
      /\b(ssr|semi\s*senior)\b/i,
    ],
  },
  {
    band: 'mid',
    patterns: [
      /\b(analista(\s+senior)?|especialista|consultor[a]?|profesional\s+de)\b/i,
      /\b(asistente\s+ejecutiv[oa]|executive\s+assistant)\b/i,
      /\b(\d+\+?\s*a[nñ]os\s+de\s+experiencia)\b/i,
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

/** Infer the seniority band implied by role/title text (highest match wins). */
export function inferSeniorityBandFromText(text: string): SeniorityBand | null {
  const normalized = normalizeForMatch(text);

  if (normalized.length === 0) {
    return null;
  }

  let bestBand: SeniorityBand | null = null;
  let bestRank = Number.POSITIVE_INFINITY;

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

/** Search queries to feed findSeniorities based on inferred band. */
export function senioritySearchQueriesForBand(band: SeniorityBand): string[] {
  switch (band) {
    case 'executive':
      return ['CEO', 'Director', 'Gerente'];
    case 'director':
      return ['Director', 'Gerente', 'CEO'];
    case 'manager':
      return ['Gerente', 'Jefe', 'Director'];
    case 'lead':
      return ['Jefe', 'Gerente', 'Lider'];
    case 'mid':
      return ['Analista', 'Asistente', 'Especialista'];
    case 'junior':
      return ['Junior', 'Asistente', 'Analista'];
    case 'entry':
      return ['Asistente', 'Trainee', 'Pasante'];
    default:
      return [];
  }
}

export function buildSeniorityInferenceGuidelines(
  seniorities: IdCatalogOption[],
): string {
  const catalogList =
    seniorities.length > 0
      ? seniorities.map((item) => item.name).join(', ')
      : '(sin opciones cargadas)';

  return `
Seniority (filters.seniorityIds):
- Es casi siempre inferible del cargo o título aunque el usuario no diga "seniority" explícitamente.
- SIEMPRE que el prompt describa un rol, llamá primero a inferSeniorityFromRole con el cargo/título detectado y luego findSeniorities con los términos sugeridos si hace falta confirmar ids.
- Guía de niveles (elegí ids del catálogo que mejor encajen):
  * Ejecutivo / C-level (CEO, CFO, CTO, CMO, COO, presidente, vicepresidente, socio): banda ejecutiva → opciones más altas del catálogo.
  * Gerente, manager, jefe de área/equipo, supervisor: banda gerencial.
  * Team lead, coordinador, líder de equipo: banda liderazgo intermedio.
  * Analista, especialista, asistente ejecutivo/a: banda media.
  * Junior, semi senior: banda junior.
  * Data entry, carga de datos, trainee, pasante, practicante, auxiliar administrativo, recepcionista: banda inicial / entrada.
- Ejemplos: "gerente comercial" → Gerente o superior; "CEO" → CEO/Director; "data entry" → nivel más bajo disponible.
- Nunca inventes ids: solo los devueltos por herramientas.
- Catálogo de seniorities de la organización: ${catalogList}.`;
}
