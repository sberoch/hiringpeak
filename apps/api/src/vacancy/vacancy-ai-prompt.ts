import {
  countries,
  languages,
  provinceGroups,
} from '@workspace/shared/static/catalogs';
import type { IdCatalogOption } from './vacancy-ai.matcher';

export const VACANCY_AI_DESCRIPTION_MAX_LENGTH = 1500;

export type CatalogContext = {
  areas: IdCatalogOption[];
  companies: Array<IdCatalogOption & { description?: string | null }>;
  industries: IdCatalogOption[];
  seniorities: IdCatalogOption[];
};

function formatIdCatalog(items: IdCatalogOption[], emptyLabel: string) {
  if (items.length === 0) {
    return emptyLabel;
  }

  return items.map((item) => `- ${item.id}: ${item.name}`).join('\n');
}

function formatCompanyCatalog(companies: CatalogContext['companies']) {
  if (companies.length === 0) {
    return '(sin empresas activas cargadas)';
  }

  return companies
    .map((company) => {
      const description = company.description?.trim();
      return description
        ? `- ${company.id}: ${company.name} — ${description}`
        : `- ${company.id}: ${company.name}`;
    })
    .join('\n');
}

function buildDescriptionGuidelines() {
  return `
Descripción (campo description):
- Redacta un breve perfil de la vacante en lenguaje formal y profesional (tono de usted).
- Debe ser un texto útil para publicar o compartir la búsqueda: rol u objetivo, competencias o habilidades esperadas, y requisitos clave inferidos del prompt.
- Incorpora de forma natural, solo si los resolviste: rango de experiencia (seniority), idiomas, país y provincia.
- Evita listas extensas de viñetas; prefiere uno o dos párrafos breves y, como máximo, una lista corta de 3 a 5 ítems.
- Máximo ${VACANCY_AI_DESCRIPTION_MAX_LENGTH} caracteres.
- No repitas el título literalmente; complétalo.
- No inventes ubicación, idiomas, experiencia ni competencias que no estén respaldadas por el prompt o los documentos.`;
}

function buildSeniorityGuidelines() {
  return `
Seniority (filters.seniorityIds):
- Es casi siempre inferible del cargo o título aunque el usuario no diga "seniority" explícitamente.
- Sé agresivo al mapear señales de liderazgo y trayectoria al catálogo. "Vasta/amplia trayectoria", "liderar equipos", "responsable del área", "estrategia", "reporta al CEO/directorio" suelen implicar Gerente, Director o superior.
- Guía de niveles (elige los ids del catálogo de seniorities que mejor encajen):
  * Ejecutivo / C-level (CEO, CFO, CTO, CMO, COO, presidente, vicepresidente, socio): opciones más altas del catálogo.
  * Gerente, manager, jefe de área/equipo, supervisor: banda gerencial.
  * Team lead, coordinador, líder de equipo: banda de liderazgo intermedio.
  * Analista, especialista, asistente ejecutivo/a: banda media.
  * Junior, semi senior: banda junior.
  * Data entry, carga de datos, trainee, pasante, practicante, auxiliar administrativo, recepcionista: el nivel más bajo disponible.
- Ejemplos: "gerente comercial" → Gerente o superior; "CEO" → CEO/Director; "data entry" → nivel más bajo disponible.`;
}

export function buildExtractionSystemPrompt(catalogs: CatalogContext) {
  const provinceLines = provinceGroups
    .map((group) => `- ${group.country}: ${group.provinces.join(', ')}`)
    .join('\n');

  return `
Eres un extractor de vacantes para un ATS. A partir del prompt del usuario y los documentos adjuntos produces un borrador estructurado de la vacante.

Reglas:
- filters siempre debe existir en la respuesta.
- Haz el mejor esfuerzo para inferir title y description aunque el usuario no los exprese literalmente.
- Para seniorityIds, areaIds, industryIds y companyId usa EXCLUSIVAMENTE ids de los catálogos listados abajo. Nunca inventes ids.
- Para countries, provinces y languages usa EXCLUSIVAMENTE los nombres listados abajo, escritos exactamente igual.
- companyId es opcional y conservador: complétalo solo si el prompt o los documentos nombran una empresa que coincide claramente con una del catálogo. Si la empresa tiene descripción en el catálogo, úsala como señal para industryIds.
- Interpreta listas con "y" u "o" como arreglos OR. Nunca conviertas eso en lógica AND estructurada.
- Si un dato no está respaldado por el prompt o los documentos, déjalo vacío.
- Campos numéricos opcionales (minStars, minAge, maxAge): complétalos solo si el usuario los menciona explícitamente; nunca uses 0 como relleno.
- assignedTo y statusId NO forman parte de esta extracción.
${buildSeniorityGuidelines()}
${buildDescriptionGuidelines()}

Metadata:
- metadata.inferredFields: nombres de los campos que inferiste sin mención explícita del usuario.
- metadata.unresolvedSignals: señales del prompt que no pudiste mapear a ningún catálogo.

Catálogo de seniorities (id: nombre):
${formatIdCatalog(catalogs.seniorities, '(sin seniorities cargados)')}

Catálogo de áreas (id: nombre):
${formatIdCatalog(catalogs.areas, '(sin áreas cargadas)')}

Catálogo de industrias (id: nombre):
${formatIdCatalog(catalogs.industries, '(sin industrias cargadas)')}

Empresas activas de la organización (id: nombre — descripción):
${formatCompanyCatalog(catalogs.companies)}

Países permitidos:
${countries.map((country) => country.name).join(', ')}

Idiomas permitidos:
${languages.map((language) => language.name).join(', ')}

Provincias permitidas por país:
${provinceLines}
`;
}
