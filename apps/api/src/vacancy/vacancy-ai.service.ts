import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateText, Output } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { asc, and, desc, eq, inArray } from 'drizzle-orm';
import type {
  AiVacancyDraft,
  AiVacancyRunDetail,
  ExtractVacancyAiResponse,
} from '@workspace/shared/types/vacancy-ai';
import { AiVacancyDraftSchema } from '@workspace/shared/dtos';
import {
  areas,
  candidateVacancies,
  candidateVacancyStatuses,
  candidates,
  companies,
  industries,
  seniorities,
  users,
  vacancies,
  vacancyStatuses,
} from '@workspace/shared/schemas';
import { CompanyStatus } from '@workspace/shared/enums';
import {
  countries,
  languages,
  provinceGroups,
} from '@workspace/shared/static/catalogs';
import {
  inferCountriesFromProvinces,
  inferDefaultLanguagesFromCountries,
} from '@workspace/shared/static/location-defaults';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { VacancyAiAnalyticsService } from './vacancy-ai.analytics.service';
import type {
  CreateAiVacancyServiceDto,
  ExtractVacancyAiServiceParams,
} from './vacancy-ai.dto';
import { searchIdCatalog, type IdCatalogOption } from './vacancy-ai.matcher';
import {
  buildExtractionSystemPrompt,
  VACANCY_AI_DESCRIPTION_MAX_LENGTH,
  type CatalogContext,
} from './vacancy-ai-prompt';
import { VacancyService } from './vacancy.service';
import {
  assertExtractHasInput,
  buildExtractionPromptText,
  normalizeFilesForModel,
  resolveSourceType,
} from './vacancy-ai-files';
import {
  inferSeniorityBandFromText,
  resolveSeniorityIdsFromInference,
} from './vacancy-ai-seniority';

const DEFAULT_MIN_STARS = 3.5;
const DEFAULT_COUNTRY = 'Argentina';
const DEFAULT_PROVINCE = 'Buenos Aires';
const DEFAULT_LANGUAGE_ENGLISH = 'Inglés';

const EXTRACTION_METADATA_SCHEMA = z.object({
  inferredFields: z.array(z.string()).default([]),
  unresolvedSignals: z.array(z.string()).default([]),
});

const EXTRACTION_RESULT_SCHEMA = z.object({
  draft: AiVacancyDraftSchema,
  metadata: EXTRACTION_METADATA_SCHEMA,
});
type ExtractionResult = z.infer<typeof EXTRACTION_RESULT_SCHEMA>;
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

function createEmptyDraft(): AiVacancyDraft {
  return {
    filters: {},
  };
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toJsonValue(value: unknown): JsonValue {
  if (value == null) {
    return null;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toJsonValue(item));
  }

  if (isJsonObject(value)) {
    const entries = Object.entries(value).map(([key, entryValue]) => [
      key,
      toJsonValue(entryValue),
    ]);

    return Object.fromEntries(entries);
  }

  return String(value);
}

function normalizeOptionalText(value?: string | null) {
  if (value == null) {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function normalizeOptionalSalary(value?: string | null) {
  if (value == null) {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function clampVacancyDescription(value: string) {
  if (value.length <= VACANCY_AI_DESCRIPTION_MAX_LENGTH) {
    return value;
  }

  const truncated = value.slice(0, VACANCY_AI_DESCRIPTION_MAX_LENGTH - 1);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  if (lastSpaceIndex > VACANCY_AI_DESCRIPTION_MAX_LENGTH * 0.75) {
    return `${truncated.slice(0, lastSpaceIndex).trimEnd()}…`;
  }

  return `${truncated.trimEnd()}…`;
}

function resolveCatalogNames(
  ids: number[] | undefined,
  catalog: IdCatalogOption[],
) {
  if (!ids?.length) {
    return undefined;
  }

  const namesById = new Map(catalog.map((item) => [item.id, item.name]));
  const names = ids
    .map((id) => namesById.get(id))
    .filter((name): name is string => Boolean(name));

  return names.length > 0 ? names : undefined;
}

function formatResolvedFiltersSummary(
  draft: AiVacancyDraft,
  catalogs: CatalogContext,
) {
  const lines: string[] = [];
  const seniorityNames = resolveCatalogNames(
    draft.filters.seniorityIds,
    catalogs.seniorities,
  );
  const areaNames = resolveCatalogNames(draft.filters.areaIds, catalogs.areas);
  const industryNames = resolveCatalogNames(
    draft.filters.industryIds,
    catalogs.industries,
  );

  if (seniorityNames) {
    lines.push(`- Experiencia / seniority: ${seniorityNames.join(', ')}`);
  }

  if (areaNames) {
    lines.push(`- Áreas / rol: ${areaNames.join(', ')}`);
  }

  if (industryNames) {
    lines.push(`- Industrias: ${industryNames.join(', ')}`);
  }

  if (draft.filters.countries?.length) {
    lines.push(`- Países: ${draft.filters.countries.join(', ')}`);
  }

  if (draft.filters.provinces?.length) {
    lines.push(`- Provincias: ${draft.filters.provinces.join(', ')}`);
  }

  if (draft.filters.languages?.length) {
    lines.push(`- Idiomas: ${draft.filters.languages.join(', ')}`);
  }

  if (draft.filters.minAge != null || draft.filters.maxAge != null) {
    const minAge = draft.filters.minAge ?? 'sin mínimo';
    const maxAge = draft.filters.maxAge ?? 'sin máximo';
    lines.push(`- Rango de edad: ${minAge} – ${maxAge}`);
  }

  if (draft.companyId != null) {
    const company = catalogs.companies.find(
      (item) => item.id === draft.companyId,
    );

    if (company) {
      lines.push(`- Empresa: ${company.name}`);
    }
  }

  return lines.length > 0
    ? lines.join('\n')
    : 'Sin filtros adicionales resueltos.';
}

function buildDescriptionGuidelines() {
  return `
Descripción (campo description):
- Redacta un breve perfil de la vacante en lenguaje formal y profesional (tono de usted).
- Debe ser un texto útil para publicar o compartir la búsqueda: rol u objetivo, competencias o habilidades esperadas, y requisitos clave inferidos del prompt.
- Incorpora de forma natural, solo si están en el contexto resuelto: rango de experiencia (seniority), idiomas, país y provincia.
- Evita listas extensas de viñetas; prefiere uno o dos párrafos breves y, como máximo, una lista corta de 3 a 5 ítems.
- Máximo ${VACANCY_AI_DESCRIPTION_MAX_LENGTH} caracteres.
- No repitas el título literalmente; complétalo.
- No inventes ubicación, idiomas, experiencia ni competencias que no estén respaldadas por el prompt o el contexto resuelto.`;
}

function uniqueNumbers(values?: number[]) {
  if (!values || values.length === 0) {
    return undefined;
  }

  return Array.from(new Set(values));
}

function uniqueStrings(values?: string[]) {
  if (!values || values.length === 0) {
    return undefined;
  }

  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

function filterAllowedIds(
  values: number[] | undefined,
  allowedIds: Set<number>,
) {
  const uniqueValues = uniqueNumbers(values);

  if (!uniqueValues) {
    return undefined;
  }

  const filteredValues = uniqueValues.filter((value) => allowedIds.has(value));
  return filteredValues.length > 0 ? filteredValues : undefined;
}

function filterAllowedStrings(
  values: string[] | undefined,
  allowedValues: Set<string>,
) {
  const uniqueValues = uniqueStrings(values);

  if (!uniqueValues) {
    return undefined;
  }

  const filteredValues = uniqueValues.filter((value) =>
    allowedValues.has(value),
  );
  return filteredValues.length > 0 ? filteredValues : undefined;
}

function sanitizeDraft(draft: AiVacancyDraft, catalogs: CatalogContext) {
  const allowedAreaIds = new Set(catalogs.areas.map((item) => item.id));
  const allowedCompanyIds = new Set(catalogs.companies.map((item) => item.id));
  const allowedIndustryIds = new Set(
    catalogs.industries.map((item) => item.id),
  );
  const allowedSeniorityIds = new Set(
    catalogs.seniorities.map((item) => item.id),
  );
  const allowedCountries = new Set(countries.map((country) => country.name));
  const allowedLanguages = new Set(languages.map((language) => language.name));
  const allowedProvinces = new Set(
    provinceGroups.flatMap((group) => group.provinces),
  );

  const normalizedTitle = normalizeOptionalText(draft.title);
  const normalizedDescription = normalizeOptionalText(draft.description);
  const normalizedSalary = normalizeOptionalSalary(draft.salary ?? undefined);
  const normalizedMinAge = draft.filters.minAge;
  const normalizedMaxAge = draft.filters.maxAge;
  const provinces = filterAllowedStrings(
    draft.filters.provinces,
    allowedProvinces,
  );
  const resolvedCountries = filterAllowedStrings(
    inferCountriesFromProvinces(
      provinces ?? [],
      filterAllowedStrings(draft.filters.countries, allowedCountries),
    ),
    allowedCountries,
  );
  const resolvedLanguages = filterAllowedStrings(
    inferDefaultLanguagesFromCountries(
      resolvedCountries ?? [],
      filterAllowedStrings(draft.filters.languages, allowedLanguages),
    ),
    allowedLanguages,
  );

  const filters = {
    seniorityIds: filterAllowedIds(
      draft.filters.seniorityIds,
      allowedSeniorityIds,
    ),
    areaIds: filterAllowedIds(draft.filters.areaIds, allowedAreaIds),
    industryIds: filterAllowedIds(
      draft.filters.industryIds,
      allowedIndustryIds,
    ),
    minStars: draft.filters.minStars,
    gender: normalizeOptionalText(draft.filters.gender),
    minAge:
      normalizedMinAge != null &&
      normalizedMaxAge != null &&
      normalizedMinAge > normalizedMaxAge
        ? undefined
        : normalizedMinAge,
    maxAge:
      normalizedMinAge != null &&
      normalizedMaxAge != null &&
      normalizedMinAge > normalizedMaxAge
        ? undefined
        : normalizedMaxAge,
    provinces,
    countries: resolvedCountries,
    languages: resolvedLanguages,
  };

  const sanitizedDraft: AiVacancyDraft = {
    filters,
  };

  if (normalizedTitle) {
    sanitizedDraft.title = normalizedTitle;
  }

  if (normalizedDescription) {
    sanitizedDraft.description = clampVacancyDescription(normalizedDescription);
  }

  if (normalizedSalary) {
    sanitizedDraft.salary = normalizedSalary;
  }

  if (draft.companyId != null && allowedCompanyIds.has(draft.companyId)) {
    sanitizedDraft.companyId = draft.companyId;
  }

  return sanitizedDraft;
}

function findCompanyContext(
  catalogs: CatalogContext,
  companyId: number | undefined,
) {
  if (companyId == null) {
    return undefined;
  }

  return catalogs.companies.find((company) => company.id === companyId);
}

function buildInferenceText(
  draft: AiVacancyDraft,
  promptText: string,
  companyContext?: { name: string; description?: string | null },
) {
  return [
    promptText,
    draft.title,
    draft.description,
    companyContext?.name,
    companyContext?.description ?? undefined,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(' ');
}

function inferSingleCatalogIdFromTexts(
  texts: Array<string | undefined>,
  catalog: IdCatalogOption[],
) {
  let bestMatch:
    | {
        id: number;
        score: number;
      }
    | undefined;

  for (const text of texts) {
    if (!text?.trim()) {
      continue;
    }

    const [match] = searchIdCatalog(text, catalog, {
      autoSelectThreshold: 0.58,
      minimumScore: 0.22,
      limit: 1,
    });

    if (!match?.autoSelectable) {
      continue;
    }

    if (!bestMatch || match.score > bestMatch.score) {
      bestMatch = {
        id: match.id,
        score: match.score,
      };
    }
  }

  return bestMatch ? [bestMatch.id] : undefined;
}

function isMidSeniorityOrHigher(text: string) {
  const inferredBand = inferSeniorityBandFromText(text);

  return (
    inferredBand === 'mid' ||
    inferredBand === 'lead' ||
    inferredBand === 'manager' ||
    inferredBand === 'director' ||
    inferredBand === 'executive'
  );
}

function applyDeterministicVacancyPolicy(
  draft: AiVacancyDraft,
  catalogs: CatalogContext,
  promptText: string,
): AiVacancyDraft {
  const companyContext = findCompanyContext(catalogs, draft.companyId);
  const inferenceText = buildInferenceText(draft, promptText, companyContext);
  const nextDraft: AiVacancyDraft = {
    ...draft,
    filters: {
      ...draft.filters,
    },
  };

  if (!nextDraft.filters.seniorityIds?.length) {
    nextDraft.filters.seniorityIds =
      resolveSeniorityIdsFromInference(inferenceText, catalogs.seniorities) ??
      undefined;
  }

  if (!nextDraft.filters.areaIds?.length) {
    nextDraft.filters.areaIds = inferSingleCatalogIdFromTexts(
      [
        nextDraft.title,
        promptText,
        companyContext?.description ?? undefined,
        nextDraft.description,
      ],
      catalogs.areas,
    );
  }

  if (!nextDraft.filters.industryIds?.length) {
    nextDraft.filters.industryIds = inferSingleCatalogIdFromTexts(
      [
        companyContext?.description ?? undefined,
        promptText,
        nextDraft.title,
        nextDraft.description,
      ],
      catalogs.industries,
    );
  }

  if (nextDraft.filters.minStars == null) {
    nextDraft.filters.minStars = DEFAULT_MIN_STARS;
  }

  if (!nextDraft.filters.countries?.length) {
    nextDraft.filters.countries = [DEFAULT_COUNTRY];
  }

  if (
    !nextDraft.filters.provinces?.length &&
    nextDraft.filters.countries?.length === 1 &&
    nextDraft.filters.countries[0] === DEFAULT_COUNTRY
  ) {
    nextDraft.filters.provinces = [DEFAULT_PROVINCE];
  }

  if (!nextDraft.filters.languages?.length) {
    const inferredLanguages = inferDefaultLanguagesFromCountries(
      nextDraft.filters.countries ?? [],
    );

    const nextLanguages = new Set(inferredLanguages ?? []);

    if (isMidSeniorityOrHigher(inferenceText)) {
      nextLanguages.add(DEFAULT_LANGUAGE_ENGLISH);
    }

    nextDraft.filters.languages =
      nextLanguages.size > 0 ? Array.from(nextLanguages) : undefined;
  }

  return sanitizeDraft(nextDraft, catalogs);
}

function combineUsage(...usages: Array<{ [key: string]: any } | undefined>) {
  const definedUsages = usages.filter(
    (usage): usage is NonNullable<typeof usage> => usage != null,
  );

  const sum = (values: Array<number | undefined>) =>
    values.some((value) => value != null)
      ? values.reduce((accumulator, value) => accumulator + (value ?? 0), 0)
      : undefined;

  return {
    inputTokens: sum(definedUsages.map((usage) => usage.inputTokens)),
    inputTokenDetails: {
      noCacheTokens: sum(
        definedUsages.map((usage) => usage.inputTokenDetails?.noCacheTokens),
      ),
      cacheReadTokens: sum(
        definedUsages.map((usage) => usage.inputTokenDetails?.cacheReadTokens),
      ),
      cacheWriteTokens: sum(
        definedUsages.map((usage) => usage.inputTokenDetails?.cacheWriteTokens),
      ),
    },
    outputTokens: sum(definedUsages.map((usage) => usage.outputTokens)),
    outputTokenDetails: {
      textTokens: sum(
        definedUsages.map((usage) => usage.outputTokenDetails?.textTokens),
      ),
      reasoningTokens: sum(
        definedUsages.map((usage) => usage.outputTokenDetails?.reasoningTokens),
      ),
    },
    totalTokens: sum(definedUsages.map((usage) => usage.totalTokens)),
  };
}

function buildStage1UserMessage(
  files: VacancyAiUploadFile[],
  promptText: string,
): UserModelMessage {
  return {
    role: 'user',
    content: [
      ...files.map((file) => ({
        type: 'file' as const,
        data: file.buffer,
        mediaType: file.mimeType,
      })),
      {
        type: 'text' as const,
        text: promptText,
      },
    ],
  };
}

function buildContextGenerationPrompt(
  catalogs: CatalogContext,
  hasDocuments: boolean,
) {
  return `
Eres un resolutor de contexto para vacantes en un ATS.

Objetivo:
- Leer ${hasDocuments ? 'los documentos adjuntos y el prompt del usuario' : 'el prompt prompt del usuario'}.
- Resolver ids y listas permitidas usando herramientas.
- Construir un contexto preliminar para una extracción estructurada posterior.

Reglas:
- Haz el mejor esfuerzo para inferir title y description si el usuario no los expresa literalmente.
${buildDescriptionGuidelines()}
- Nunca inventes ids.
- Para area, industry y company usa solamente ids devueltos por herramientas.
${buildSeniorityInferenceGuidelines(catalogs.seniorities)}
- companyId es opcional y debe ser conservador: solo completar si el match es realmente consistente.
- Si resuelves companyId y todavía falta industry, llama a getCompanyInferenceContext antes de decidir industryIds.
- Para industry, prioriza señales históricas del tenant para esa compañía por encima de conocimiento general de marca. Usa company + area + prompt para desempatar.
- assignedTo y statusId NO forman parte de esta extracción.
- Interpreta listas con "y" u "o" como arreglos OR. Nunca conviertas eso en lógica AND estructurada.
- Si un dato no está, déjalo vacío.
- filters siempre debe existir.
- No respondas con texto final.
- Cuando termines, llama exactamente una vez a la herramienta ${SUBMIT_DRAFT_CONTEXT_TOOL}.
- Si no necesitas buscar nada, igual debes terminar llamando ${SUBMIT_DRAFT_CONTEXT_TOOL}.

Contexto adicional:
- Hay ${catalogs.seniorities.length} seniorities cargados.
- Hay ${catalogs.areas.length} áreas cargadas.
- Hay ${catalogs.industries.length} industrias cargadas.
- Hay ${catalogs.companies.length} compañías activas cargadas.
`;
}

function buildStructuredExtractionPrompt(
  originalPrompt: string,
  resolvedContext: ExtractionResult,
  catalogs: CatalogContext,
) {
  const filtersSummary = formatResolvedFiltersSummary(
    resolvedContext.draft,
    catalogs,
  );

  return `
Eres un extractor final de vacantes para un ATS.

Debes producir un resultado estructurado final.

Instrucciones:
- Usa el prompt original y el contexto resuelto como base.
- Conserva exactamente los ids y listas ya resueltos en el contexto.
- Nunca inventes ids nuevos.
- Puedes mejorar title, description y salary para que sean claros y útiles.
${buildDescriptionGuidelines()}
- Prioriza reescribir description en la extracción final: debe reflejar el resumen de filtros resueltos cuando aplique.
- Si falta un dato, déjalo vacío.
- filters siempre debe existir.

Prompt original:
${originalPrompt}

Filtros resueltos (referencia legible para la descripción):
${filtersSummary}

Contexto resuelto:
${JSON.stringify(resolvedContext, null, 2)}
`;
}

function getSubmittedDraftContext(
  toolCalls: Array<{ toolName: string; input: unknown }>,
) {
  const finalToolCall = [...toolCalls]
    .reverse()
    .find((toolCall) => toolCall.toolName === SUBMIT_DRAFT_CONTEXT_TOOL);

  if (!finalToolCall) {
    throw new Error(
      'Vacancy AI context generation did not submit draft context',
    );
  }

  return EXTRACTION_RESULT_SCHEMA.parse(finalToolCall.input);
}

@Injectable()
export class VacancyAiService {
  private readonly logger = new Logger(VacancyAiService.name);

  constructor(
    @Inject(DrizzleProvider) private readonly db: DrizzleDatabase,
    private readonly configService: ConfigService,
    private readonly vacancyAiAnalyticsService: VacancyAiAnalyticsService,
    private readonly vacancyService: VacancyService,
  ) {}

  async extract(
    params: ExtractVacancyAiServiceParams,
  ): Promise<ExtractVacancyAiResponse> {
    const files = params.files ?? [];
    const userPrompt = params.userPrompt?.trim() || undefined;
    assertExtractHasInput(userPrompt, files);

    const sourceType = resolveSourceType(userPrompt, files);
    const promptText = buildExtractionPromptText(userPrompt, files);
    const documentInputs = files.map((file, index) => ({
      fileName: file.fileName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      sortOrder: index,
    }));

    const fileParts = await normalizeFilesForModel(files);

    const publicToken = crypto.randomUUID();
    const startedAt = Date.now();
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const modelName =
      this.configService.get<string>('VACANCY_AI_MODEL') ?? 'gpt-5.4-mini';
    const openai = createOpenAI(apiKey ? { apiKey } : {});
    const catalogs = await this.loadCatalogContext(params.organizationId);

    try {
      const result = await generateText({
        model: openai(modelName),
        system: buildExtractionSystemPrompt(catalogs),
        messages: [
          {
            role: 'user',
            content: [...fileParts, { type: 'text', text: promptText }],
          },
        ],
        output: Output.object({
          schema: EXTRACTION_RESULT_SCHEMA,
          name: 'vacancy_draft_extraction',
          description: 'Structured vacancy draft extraction result',
        }),
      });

      const sanitizedDraft = applyDeterministicVacancyPolicy(
        sanitizeDraft(result.output.draft, catalogs),
        catalogs,
        promptText,
      );
      this.logger.debug({
        model: modelName,
        publicToken,
        usage: result.usage,
      });

      const latencyMs = Date.now() - startedAt;

      await this.vacancyAiAnalyticsService.createRun({
        publicToken,
        organizationId: params.organizationId,
        userId: params.userId,
        prompt: promptText,
        sourceType,
        userPrompt: userPrompt ?? null,
        model: modelName,
        status: 'succeeded',
        responseText: result.text,
        draft: sanitizedDraft,
        documents: documentInputs,
        extractionMetadata: toJsonValue({
          finalMetadata: result.output.metadata,
          documentCount: files.length,
        }),
        totalUsage: toJsonValue({ extraction: result.usage }),
        latencyMs,
      });

      return {
        token: publicToken,
        draft: sanitizedDraft,
      };
    } catch (error) {
      this.logger.error(
        `Vacancy AI extraction failed for token ${publicToken}`,
        error instanceof Error ? error.stack : undefined,
      );
      const latencyMs = Date.now() - startedAt;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown extraction error';

      await this.vacancyAiAnalyticsService.createRun({
        publicToken,
        organizationId: params.organizationId,
        userId: params.userId,
        prompt: promptText,
        sourceType,
        userPrompt: userPrompt ?? null,
        model: modelName,
        status: 'failed',
        draft: createEmptyDraft(),
        documents: documentInputs,
        errorMessage,
        latencyMs,
      });

      throw new BadGatewayException(
        'No se pudo generar el borrador con IA. Intenta nuevamente.',
      );
    }
  }

  listRuns(organizationId: number, userId: number) {
    return this.vacancyAiAnalyticsService.listRuns(organizationId, userId);
  }

  findRunByToken(
    publicToken: string,
    organizationId: number,
    userId: number,
  ): Promise<AiVacancyRunDetail> {
    return this.vacancyAiAnalyticsService.findRunDetailByToken(
      publicToken,
      organizationId,
      userId,
    );
  }

  async findAiSourceForVacancy(vacancyId: number, organizationId: number) {
    const vacancy = await this.db.query.vacancies.findFirst({
      where: and(
        eq(vacancies.id, vacancyId),
        eq(vacancies.organizationId, organizationId),
      ),
      columns: {
        id: true,
        aiVacancyRunId: true,
      },
    });

    if (!vacancy?.aiVacancyRunId) {
      return null;
    }

    return this.vacancyAiAnalyticsService.findRunDetailById(
      vacancy.aiVacancyRunId,
      organizationId,
    );
  }

  async create(params: CreateAiVacancyServiceDto) {
    const run = await this.vacancyAiAnalyticsService.findRunByToken(
      params.token,
      params.organizationId,
      params.createdBy,
    );

    const uniqueCandidateIds = Array.from(new Set(params.selectedCandidateIds));

    if (uniqueCandidateIds.length === 0) {
      throw new BadRequestException(
        'At least one candidate must be selected to create the vacancy',
      );
    }

    const title = normalizeOptionalText(params.draft.title);

    if (!title) {
      throw new BadRequestException('Vacancy title is required');
    }

    const [company, status, assignedUser, matchingCandidates, initialStatus] =
      await Promise.all([
        this.db.query.companies.findFirst({
          where: and(
            eq(companies.id, params.companyId),
            eq(companies.organizationId, params.organizationId),
          ),
        }),
        this.db.query.vacancyStatuses.findFirst({
          where: and(
            eq(vacancyStatuses.id, params.statusId),
            eq(vacancyStatuses.organizationId, params.organizationId),
          ),
        }),
        this.db.query.users.findFirst({
          where: and(
            eq(users.id, params.assignedTo),
            eq(users.organizationId, params.organizationId),
          ),
        }),
        this.db.query.candidates.findMany({
          where: and(
            eq(candidates.organizationId, params.organizationId),
            inArray(candidates.id, uniqueCandidateIds),
            eq(candidates.deleted, false),
          ),
          columns: {
            id: true,
          },
        }),
        this.db.query.candidateVacancyStatuses.findFirst({
          where: and(
            eq(candidateVacancyStatuses.organizationId, params.organizationId),
            eq(candidateVacancyStatuses.isInitial, true),
          ),
        }),
      ]);

    if (!company) {
      throw new BadRequestException('Selected company is invalid');
    }

    if (!status) {
      throw new BadRequestException('Selected vacancy status is invalid');
    }

    if (!assignedUser) {
      throw new BadRequestException('Selected assigned user is invalid');
    }

    if (!initialStatus) {
      throw new BadRequestException(
        'No initial candidate vacancy status is configured',
      );
    }

    if (matchingCandidates.length !== uniqueCandidateIds.length) {
      throw new BadRequestException(
        'One or more selected candidates are invalid',
      );
    }

    const vacancyDraft = {
      ...params.draft,
      title,
      companyId: params.companyId,
    };

    await this.vacancyAiAnalyticsService.recordSubmitted(run.id, {
      assignedTo: params.assignedTo,
      companyId: params.companyId,
      draft: vacancyDraft,
      selectedCandidateIds: uniqueCandidateIds,
      statusId: params.statusId,
    });

    const createdVacancy = await this.db.transaction(async (tx) => {
      const vacancy = await this.vacancyService.createRecord(tx, {
        organizationId: params.organizationId,
        assignedTo: params.assignedTo,
        companyId: params.companyId,
        createdBy: params.createdBy,
        description: normalizeOptionalText(params.draft.description) ?? '',
        filters: {
          areaIds: params.draft.filters.areaIds ?? [],
          countries: params.draft.filters.countries,
          gender: params.draft.filters.gender,
          industryIds: params.draft.filters.industryIds ?? [],
          languages: params.draft.filters.languages,
          maxAge: params.draft.filters.maxAge,
          minAge: params.draft.filters.minAge,
          minStars: params.draft.filters.minStars,
          provinces: params.draft.filters.provinces,
          seniorityIds: params.draft.filters.seniorityIds ?? [],
        },
        salary: normalizeOptionalSalary(params.draft.salary) ?? null,
        statusId: params.statusId,
        title,
        aiVacancyRunId: run.id,
      });

      await tx.insert(candidateVacancies).values(
        uniqueCandidateIds.map((candidateId) => ({
          candidateId,
          vacancyId: vacancy.id,
          candidateVacancyStatusId: initialStatus.id,
          organizationId: params.organizationId,
          notes: '',
          rejectionReason: null,
        })),
      );

      return vacancy;
    });

    await this.vacancyAiAnalyticsService.recordCreated(run.id, {
      vacancyId: createdVacancy.id,
    });

    return this.vacancyService.findOne(
      createdVacancy.id,
      params.organizationId,
    );
  }

  private async loadCatalogContext(
    organizationId: number,
  ): Promise<CatalogContext> {
    const [areaItems, companyItems, industryItems, seniorityItems] =
      await Promise.all([
        this.db.query.areas.findMany({
          where: eq(areas.organizationId, organizationId),
          columns: {
            id: true,
            name: true,
          },
          orderBy: [asc(areas.name)],
        }),
        this.db.query.companies.findMany({
          where: and(
            eq(companies.organizationId, organizationId),
            eq(companies.status, CompanyStatus.ACTIVE),
          ),
          columns: {
            id: true,
            name: true,
            description: true,
          },
          orderBy: [asc(companies.name)],
        }),
        this.db.query.industries.findMany({
          where: eq(industries.organizationId, organizationId),
          columns: {
            id: true,
            name: true,
          },
          orderBy: [asc(industries.name)],
        }),
        this.db.query.seniorities.findMany({
          where: eq(seniorities.organizationId, organizationId),
          columns: {
            id: true,
            name: true,
          },
          orderBy: [asc(seniorities.name)],
        }),
      ]);

    return {
      areas: areaItems,
      companies: companyItems,
      industries: industryItems,
      seniorities: seniorityItems,
    };
  }

  private buildContextTools(catalogs: CatalogContext, organizationId: number) {
    return {
      ...this.buildLookupTools(catalogs, organizationId),
      [SUBMIT_DRAFT_CONTEXT_TOOL]: tool({
        description:
          'Submit the resolved vacancy draft context after using search tools as needed.',
        inputSchema: EXTRACTION_RESULT_SCHEMA,
        strict: true,
        execute: async (input) => input,
      }),
    };
  }

  private buildLookupTools(catalogs: CatalogContext, organizationId: number) {
    const countryOptions = countries.map((country) => ({
      value: country.name,
    }));
    const languageOptions = languages.map((language) => ({
      value: language.name,
    }));
    const provinceOptions = provinceGroups.flatMap((group) =>
      group.provinces.map((province) => ({
        country: group.country,
        value: province,
      })),
    );

    return {
      inferSeniorityFromRole: tool({
        description:
          'Infer seniority band and catalog ids from a job title or role description (e.g. gerente comercial, CEO, data entry). Use before findSeniorities when the prompt implies a level.',
        inputSchema: z.object({
          roleText: z.string().min(1),
        }),
        execute: async ({ roleText }) => {
          const band = inferSeniorityBandFromText(roleText);
          const inferredIds = resolveSeniorityIdsFromInference(
            roleText,
            catalogs.seniorities,
          );

          return {
            band,
            inferredIds: inferredIds ?? [],
            suggestedSearchQueries: band
              ? senioritySearchQueriesForBand(band)
              : [],
          };
        },
      }),
      findSeniorities: tool({
        description:
          'Search seniority catalog options by name and return matching ids. Prefer queries like "Gerente", "Director", "CEO" derived from inferSeniorityFromRole.',
        inputSchema: z.object({
          query: z.string().min(1),
        }),
        execute: async ({ query }) => ({
          matches: searchIdCatalog(query, catalogs.seniorities, {
            autoSelectThreshold: 0.52,
            minimumScore: 0.18,
            limit: 5,
          }),
        }),
      }),
      findAreas: tool({
        description: 'Search area options and return matching ids.',
        inputSchema: z.object({
          query: z.string().min(1),
        }),
        execute: async ({ query }) => ({
          matches: searchIdCatalog(query, catalogs.areas, {
            autoSelectThreshold: 0.56,
            minimumScore: 0.2,
            limit: 5,
          }),
        }),
      }),
      findIndustries: tool({
        description:
          'Search industry options and return matching ids. If companyId is already known, use getCompanyInferenceContext first and then query the most likely tenant-specific industries.',
        inputSchema: z.object({
          query: z.string().min(1),
        }),
        execute: async ({ query }) => ({
          matches: searchIdCatalog(query, catalogs.industries, {
            autoSelectThreshold: 0.56,
            minimumScore: 0.2,
            limit: 5,
          }),
        }),
      }),
      getCompanyInferenceContext: tool({
        description:
          'Given a resolved companyId, return tenant-specific context for inferring industry and area: company description, top historical industries, top historical areas, and recent vacancy titles. Use this when companyId is known and industry is still unclear.',
        inputSchema: z.object({
          companyId: z.number().int().positive(),
        }),
        execute: async ({ companyId }) =>
          this.getCompanyInferenceContext(companyId, organizationId),
      }),
      findCompanies: tool({
        description:
          'Search active companies and return matching ids. Use conservatively.',
        inputSchema: z.object({
          query: z.string().min(1),
        }),
        execute: async ({ query }) => ({
          matches: searchIdCatalog(query, catalogs.companies, {
            autoSelectThreshold: 0.76,
            minimumScore: 0.32,
            limit: 5,
          }),
        }),
      }),
      findCountries: tool({
        description: 'Search allowed country names.',
        inputSchema: z.object({
          query: z.string().min(1),
        }),
        execute: async ({ query }) => ({
          matches: searchStringCatalog(query, countryOptions, {
            autoSelectThreshold: 0.6,
            minimumScore: 0.2,
            limit: 5,
          }),
        }),
      }),
      findProvinces: tool({
        description:
          'Search allowed province names. Optionally constrain the search with selected countries.',
        inputSchema: z.object({
          query: z.string().min(1),
          countries: z.array(z.string()).optional(),
        }),
        execute: async ({ countries: selectedCountries, query }) => {
          const normalizedCountries = new Set(
            (selectedCountries ?? []).map((country) =>
              normalizeForMatch(country),
            ),
          );
          const filteredProvinceOptions =
            normalizedCountries.size === 0
              ? provinceOptions
              : provinceOptions.filter((province) =>
                  normalizedCountries.has(normalizeForMatch(province.country)),
                );

          return {
            matches: searchStringCatalog(query, filteredProvinceOptions, {
              autoSelectThreshold: 0.6,
              minimumScore: 0.2,
              limit: 7,
            }),
          };
        },
      }),
      findLanguages: tool({
        description: 'Search allowed language names.',
        inputSchema: z.object({
          query: z.string().min(1),
        }),
        execute: async ({ query }) => ({
          matches: searchStringCatalog(query, languageOptions, {
            autoSelectThreshold: 0.6,
            minimumScore: 0.2,
            limit: 5,
          }),
        }),
      }),
    };
  }

  private async getCompanyInferenceContext(
    companyId: number,
    organizationId: number,
  ) {
    const company = await this.db.query.companies.findFirst({
      where: and(
        eq(companies.id, companyId),
        eq(companies.organizationId, organizationId),
        eq(companies.status, CompanyStatus.ACTIVE),
      ),
      columns: {
        id: true,
        name: true,
        description: true,
      },
    });

    if (!company) {
      return {
        company: null,
        historicalIndustries: [],
        historicalAreas: [],
        recentVacancyTitles: [],
      };
    }

    const companyVacancies = await this.db.query.vacancies.findMany({
      where: and(
        eq(vacancies.companyId, companyId),
        eq(vacancies.organizationId, organizationId),
      ),
      columns: {
        id: true,
        title: true,
        createdAt: true,
      },
      orderBy: [desc(vacancies.createdAt)],
      limit: 25,
      with: {
        filters: {
          with: {
            areaIds: {
              with: {
                area: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            industryIds: {
              with: {
                industry: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const countByCatalog = <T extends { id: number; name: string }>(
      items: T[],
    ) => {
      const counts = new Map<number, { id: number; name: string; count: number }>();

      for (const item of items) {
        const current = counts.get(item.id);

        if (current) {
          current.count += 1;
          continue;
        }

        counts.set(item.id, {
          id: item.id,
          name: item.name,
          count: 1,
        });
      }

      return [...counts.values()]
        .sort((left, right) => {
          if (left.count !== right.count) {
            return right.count - left.count;
          }

          return left.name.localeCompare(right.name, 'es');
        })
        .slice(0, 5);
    };

    const historicalIndustries = countByCatalog(
      companyVacancies.flatMap((vacancy) =>
        vacancy.filters?.industryIds.map((relation) => relation.industry) ?? [],
      ),
    );
    const historicalAreas = countByCatalog(
      companyVacancies.flatMap((vacancy) =>
        vacancy.filters?.areaIds.map((relation) => relation.area) ?? [],
      ),
    );

    return {
      company,
      historicalIndustries,
      historicalAreas,
      recentVacancyTitles: companyVacancies
        .slice(0, 10)
        .map((vacancy) => vacancy.title),
    };
  }
}
