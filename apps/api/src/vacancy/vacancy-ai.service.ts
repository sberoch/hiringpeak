import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateText, hasToolCall, Output, stepCountIs, tool } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { asc, and, eq, inArray } from 'drizzle-orm';
import type {
  AiVacancyDraft,
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
  vacancyStatuses,
} from '@workspace/shared/schemas';
import { CompanyStatus } from '@workspace/shared/enums';
import {
  countries,
  languages,
  provinceGroups,
} from '@workspace/shared/static/catalogs';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { VacancyAiAnalyticsService } from './vacancy-ai.analytics.service';
import type {
  CreateAiVacancyServiceDto,
  ExtractVacancyAiServiceParams,
} from './vacancy-ai.dto';
import {
  normalizeForMatch,
  searchIdCatalog,
  searchStringCatalog,
  type IdCatalogOption,
} from './vacancy-ai.matcher';
import { VacancyService } from './vacancy.service';

const EXTRACTION_METADATA_SCHEMA = z.object({
  inferredFields: z.array(z.string()).default([]),
  unresolvedSignals: z.array(z.string()).default([]),
});

const EXTRACTION_RESULT_SCHEMA = z.object({
  draft: AiVacancyDraftSchema,
  metadata: EXTRACTION_METADATA_SCHEMA,
});
const SUBMIT_DRAFT_CONTEXT_TOOL = 'submitDraftContext';

type CatalogContext = {
  areas: IdCatalogOption[];
  companies: IdCatalogOption[];
  industries: IdCatalogOption[];
  seniorities: IdCatalogOption[];
};

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
    countries: filterAllowedStrings(draft.filters.countries, allowedCountries),
    provinces: filterAllowedStrings(draft.filters.provinces, allowedProvinces),
    languages: filterAllowedStrings(draft.filters.languages, allowedLanguages),
  };

  const sanitizedDraft: AiVacancyDraft = {
    filters,
  };

  if (normalizedTitle) {
    sanitizedDraft.title = normalizedTitle;
  }

  if (normalizedDescription) {
    sanitizedDraft.description = normalizedDescription;
  }

  if (normalizedSalary) {
    sanitizedDraft.salary = normalizedSalary;
  }

  if (draft.companyId != null && allowedCompanyIds.has(draft.companyId)) {
    sanitizedDraft.companyId = draft.companyId;
  }

  return sanitizedDraft;
}

function combineUsage(...usages: Array<{ [key: string]: any } | undefined>) {
  const definedUsages = usages.filter((usage): usage is NonNullable<typeof usage> =>
    usage != null,
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

function buildContextGenerationPrompt(catalogs: CatalogContext) {
  return `
Eres un resolutor de contexto para vacantes en un ATS.

Objetivo:
- Leer un prompt libre del usuario.
- Resolver ids y listas permitidas usando herramientas.
- Construir un contexto preliminar para una extracción estructurada posterior.

Reglas:
- Haz el mejor esfuerzo para inferir title y description si el usuario no los expresa literalmente.
- Nunca inventes ids.
- Para seniority, area, industry y company usa solamente ids devueltos por herramientas.
- companyId es opcional y debe ser conservador: solo completar si el match es realmente consistente.
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
) {
  return `
Eres un extractor final de vacantes para un ATS.

Debes producir un resultado estructurado final.

Instrucciones:
- Usa el prompt original y el contexto resuelto como base.
- Conserva exactamente los ids y listas ya resueltos en el contexto.
- Nunca inventes ids nuevos.
- Puedes mejorar title, description y salary para que sean claros y útiles.
- Si falta un dato, déjalo vacío.
- filters siempre debe existir.

Prompt original:
${originalPrompt}

Contexto resuelto:
${JSON.stringify(resolvedContext, null, 2)}
`;
}

function getSubmittedDraftContext(toolCalls: Array<{ toolName: string; input: unknown }>) {
  const finalToolCall = [...toolCalls]
    .reverse()
    .find((toolCall) => toolCall.toolName === SUBMIT_DRAFT_CONTEXT_TOOL);

  if (!finalToolCall) {
    throw new Error('Vacancy AI context generation did not submit draft context');
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
    const publicToken = crypto.randomUUID();
    const startedAt = Date.now();
    const apiKey =
      this.configService.get<string>('GEMINI_API_KEY') ??
      this.configService.get<string>('GOOGLE_GENERATIVE_AI_API_KEY');
    const modelName =
      this.configService.get<string>('VACANCY_AI_MODEL') ?? 'gemini-2.5-flash';
    const google = createGoogleGenerativeAI(apiKey ? { apiKey } : {});
    const catalogs = await this.loadCatalogContext(params.organizationId);

    try {
      const contextResult = await generateText({
        model: google(modelName),
        system: buildContextGenerationPrompt(catalogs),
        prompt: params.prompt,
        tools: this.buildContextTools(catalogs),
        toolChoice: 'required',
        stopWhen: [hasToolCall(SUBMIT_DRAFT_CONTEXT_TOOL), stepCountIs(12)],
      });

      const resolvedContext = getSubmittedDraftContext(contextResult.toolCalls);
      const sanitizedContext: ExtractionResult = {
        draft: sanitizeDraft(resolvedContext.draft, catalogs),
        metadata: resolvedContext.metadata,
      };

      const structuredResult = await generateText({
        model: google(modelName),
        system: 'Eres un extractor final de vacantes para un ATS.',
        prompt: buildStructuredExtractionPrompt(params.prompt, sanitizedContext),
        output: Output.object({
          schema: EXTRACTION_RESULT_SCHEMA,
          name: 'vacancy_draft_extraction',
          description: 'Structured vacancy draft extraction result',
        }),
      });

      const sanitizedDraft = sanitizeDraft(structuredResult.output.draft, catalogs);
      this.logger.debug({
        model: modelName,
        publicToken,
        usage: combineUsage(contextResult.usage, structuredResult.usage),
      });

      const latencyMs = Date.now() - startedAt;

      await this.vacancyAiAnalyticsService.createRun({
        publicToken,
        organizationId: params.organizationId,
        userId: params.userId,
        prompt: params.prompt,
        model: modelName,
        status: 'succeeded',
        responseText: structuredResult.text,
        draft: sanitizedDraft,
        extractionMetadata: toJsonValue({
          contextMetadata: sanitizedContext.metadata,
          contextSteps: contextResult.steps,
          finalMetadata: structuredResult.output.metadata,
          structuredSteps: structuredResult.steps,
        }),
        totalUsage: toJsonValue({
          contextGeneration: contextResult.usage,
          structuredExtraction: structuredResult.usage,
          combined: combineUsage(contextResult.usage, structuredResult.usage),
        }),
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
      const fallbackDraft = createEmptyDraft();
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown extraction error';

      await this.vacancyAiAnalyticsService.createRun({
        publicToken,
        organizationId: params.organizationId,
        userId: params.userId,
        prompt: params.prompt,
        model: modelName,
        status: 'failed',
        draft: fallbackDraft,
        errorMessage,
        latencyMs,
      });

      return {
        token: publicToken,
        draft: fallbackDraft,
      };
    }
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

  private buildContextTools(catalogs: CatalogContext) {
    return {
      ...this.buildLookupTools(catalogs),
      [SUBMIT_DRAFT_CONTEXT_TOOL]: tool({
        description:
          'Submit the resolved vacancy draft context after using search tools as needed.',
        inputSchema: EXTRACTION_RESULT_SCHEMA,
        strict: true,
        execute: async (input) => input,
      }),
    };
  }

  private buildLookupTools(catalogs: CatalogContext) {
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
      findSeniorities: tool({
        description: 'Search seniority options and return matching ids.',
        inputSchema: z.object({
          query: z.string().min(1),
        }),
        execute: async ({ query }) => ({
          matches: searchIdCatalog(query, catalogs.seniorities, {
            autoSelectThreshold: 0.58,
            minimumScore: 0.2,
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
        description: 'Search industry options and return matching ids.',
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
}
