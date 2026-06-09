import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateText, NoObjectGeneratedError, Output } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { asc, and, eq, inArray } from 'drizzle-orm';
import type {
  AiVacancyDraft,
  AiVacancyRunDetail,
  ExtractVacancyAiResponse,
} from '@workspace/shared/types/vacancy-ai';
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
  LLM_EXTRACTION_RESULT_SCHEMA,
  toAiVacancyDraft,
  toExtractionMetadata,
} from './vacancy-ai-extraction-schema';
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

  if (!nextDraft.filters.minStars) {
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
        // OpenAI strict mode rejects schemas with optional properties; the
        // output is still zod-validated by the SDK and sanitized afterwards.
        providerOptions: { openai: { strictJsonSchema: false } },
        output: Output.object({
          schema: LLM_EXTRACTION_RESULT_SCHEMA,
          name: 'vacancy_draft_extraction',
          description: 'Structured vacancy draft extraction result',
        }),
      });

      const extractionMetadata = toExtractionMetadata(result.output.metadata);
      const sanitizedDraft = applyDeterministicVacancyPolicy(
        sanitizeDraft(toAiVacancyDraft(result.output.draft), catalogs),
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
          finalMetadata: extractionMetadata,
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
      if (NoObjectGeneratedError.isInstance(error)) {
        this.logger.error(
          `Raw model output for token ${publicToken}: ${error.text ?? '(empty)'}`,
        );
      }
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

}
