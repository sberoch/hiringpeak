import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  aiVacancyRunDocuments,
  aiVacancyRunEvents,
  aiVacancyRuns,
} from '@workspace/shared/schemas';
import type { AiVacancySourceType } from '@workspace/shared/types/vacancy-ai';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { FeatureFlagService } from '../feature-flag/feature-flag.service';
import { FeatureFlag } from '../feature-flag/feature-flag.enum';
import type {
  AiVacancyDraft,
  AiVacancyRunDetail,
  AiVacancyRunSummary,
  VacancyAiRunEventType,
} from '@workspace/shared/types/vacancy-ai';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface CreateAiVacancyRunDocumentInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sortOrder: number;
}

interface CreateAiVacancyRunParams {
  publicToken: string;
  organizationId: number;
  userId: number;
  prompt: string;
  sourceType: AiVacancySourceType;
  userPrompt?: string | null;
  model: string;
  status: 'succeeded' | 'failed';
  responseText?: string;
  draft?: AiVacancyDraft;
  extractionMetadata?: JsonValue;
  totalUsage?: JsonValue;
  errorMessage?: string;
  latencyMs: number;
  documents?: CreateAiVacancyRunDocumentInput[];
}

interface CreateAiVacancyRunEventParams {
  runId: number;
  type: VacancyAiRunEventType;
  payload?: JsonValue;
}

@Injectable()
export class VacancyAiAnalyticsService {
  constructor(
    @Inject(DrizzleProvider) private readonly db: DrizzleDatabase,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  async createRun(params: CreateAiVacancyRunParams) {
    const shouldPersistDetails = await this.shouldPersistDetails();
    const runValues = {
      publicToken: params.publicToken,
      organizationId: params.organizationId,
      userId: params.userId,
      prompt: params.prompt,
      sourceType: params.sourceType,
      userPrompt: params.userPrompt ?? null,
      model: params.model,
      status: params.status,
      responseText: shouldPersistDetails ? params.responseText ?? null : null,
      draft: shouldPersistDetails ? params.draft ?? null : null,
      extractionMetadata: shouldPersistDetails
        ? params.extractionMetadata ?? null
        : null,
      totalUsage: shouldPersistDetails ? params.totalUsage ?? null : null,
      errorMessage: shouldPersistDetails ? params.errorMessage ?? null : null,
      latencyMs: params.latencyMs,
    };

    const [run] = await this.db.insert(aiVacancyRuns).values(runValues).returning();

    if (!run) {
      throw new Error('Failed to create AI vacancy run');
    }

    if (shouldPersistDetails && params.documents?.length) {
      await this.db.insert(aiVacancyRunDocuments).values(
        params.documents.map((document) => ({
          runId: run.id,
          organizationId: params.organizationId,
          fileName: document.fileName,
          mimeType: document.mimeType,
          sizeBytes: document.sizeBytes,
          sortOrder: document.sortOrder,
        })),
      );
    }

    if (shouldPersistDetails) {
      await this.createEvent({
        runId: run.id,
        type: params.status === 'succeeded' ? 'extract_succeeded' : 'extract_failed',
        payload:
          params.status === 'succeeded'
            ? {
                draft: params.draft ?? null,
                extractionMetadata: params.extractionMetadata ?? null,
                totalUsage: params.totalUsage ?? null,
                documentCount: params.documents?.length ?? 0,
              }
            : {
                errorMessage: params.errorMessage ?? 'Unknown extraction error',
              },
      });
    }

    return run;
  }

  async listRuns(
    organizationId: number,
    userId: number,
    limit = 50,
  ): Promise<AiVacancyRunSummary[]> {
    const shouldPersistDetails = await this.shouldPersistDetails();

    if (!shouldPersistDetails) {
      return [];
    }

    const runs = await this.db.query.aiVacancyRuns.findMany({
      where: and(
        eq(aiVacancyRuns.organizationId, organizationId),
        eq(aiVacancyRuns.userId, userId),
      ),
      orderBy: desc(aiVacancyRuns.createdAt),
      limit,
      with: {
        documents: {
          orderBy: asc(aiVacancyRunDocuments.sortOrder),
        },
      },
    });

    return runs.map((run) => this.toRunSummary(run));
  }

  async findRunDetailByToken(
    publicToken: string,
    organizationId: number,
    userId: number,
  ): Promise<AiVacancyRunDetail> {
    const shouldPersistDetails = await this.shouldPersistDetails();

    if (!shouldPersistDetails) {
      throw new NotFoundException('AI vacancy run history is not enabled');
    }

    const run = await this.db.query.aiVacancyRuns.findFirst({
      where: and(
        eq(aiVacancyRuns.publicToken, publicToken),
        eq(aiVacancyRuns.organizationId, organizationId),
        eq(aiVacancyRuns.userId, userId),
      ),
      with: {
        documents: {
          orderBy: asc(aiVacancyRunDocuments.sortOrder),
        },
      },
    });

    if (!run) {
      throw new NotFoundException('AI vacancy run not found');
    }

    return this.toRunDetail(run);
  }

  async findRunByToken(publicToken: string, organizationId: number, userId: number) {
    const run = await this.db.query.aiVacancyRuns.findFirst({
      where: and(
        eq(aiVacancyRuns.publicToken, publicToken),
        eq(aiVacancyRuns.organizationId, organizationId),
        eq(aiVacancyRuns.userId, userId),
      ),
    });

    if (!run) {
      throw new NotFoundException('AI vacancy run not found');
    }

    return run;
  }

  async findRunDetailById(
    runId: number,
    organizationId: number,
  ): Promise<AiVacancyRunDetail | null> {
    const shouldPersistDetails = await this.shouldPersistDetails();

    if (!shouldPersistDetails) {
      return null;
    }

    const run = await this.db.query.aiVacancyRuns.findFirst({
      where: and(
        eq(aiVacancyRuns.id, runId),
        eq(aiVacancyRuns.organizationId, organizationId),
      ),
      with: {
        documents: {
          orderBy: asc(aiVacancyRunDocuments.sortOrder),
        },
      },
    });

    if (!run) {
      return null;
    }

    return this.toRunDetail(run);
  }

  async recordSubmitted(runId: number, payload: JsonValue) {
    await this.maybeCreateEvent({
      runId,
      type: 'submitted',
      payload,
    });
  }

  async recordCreated(runId: number, payload: JsonValue) {
    await this.maybeCreateEvent({
      runId,
      type: 'created',
      payload,
    });
  }

  private toRunSummary(
    run: typeof aiVacancyRuns.$inferSelect & {
      documents: (typeof aiVacancyRunDocuments.$inferSelect)[];
    },
  ): AiVacancyRunSummary {
    return {
      publicToken: run.publicToken,
      sourceType: run.sourceType,
      userPrompt: run.userPrompt,
      prompt: run.prompt,
      status: run.status,
      model: run.model,
      draft: (run.draft as AiVacancyDraft | null) ?? null,
      documents: run.documents.map((document) => ({
        id: document.id,
        fileName: document.fileName,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        sortOrder: document.sortOrder,
      })),
      createdAt: run.createdAt.toISOString(),
    };
  }

  private toRunDetail(
    run: typeof aiVacancyRuns.$inferSelect & {
      documents: (typeof aiVacancyRunDocuments.$inferSelect)[];
    },
  ): AiVacancyRunDetail {
    return {
      ...this.toRunSummary(run),
      extractionMetadata: (run.extractionMetadata as JsonValue | null) ?? null,
      errorMessage: run.errorMessage,
      latencyMs: run.latencyMs,
    };
  }

  private async maybeCreateEvent(params: CreateAiVacancyRunEventParams) {
    const shouldPersistDetails = await this.shouldPersistDetails();

    if (!shouldPersistDetails) {
      return;
    }

    await this.createEvent(params);
  }

  private async createEvent(params: CreateAiVacancyRunEventParams) {
    const payload = params.payload == null ? null : JSON.stringify(params.payload);

    await this.db.execute(sql`
      insert into ${aiVacancyRunEvents} (run_id, type, payload)
      values (${params.runId}, ${params.type}, ${payload}::jsonb)
    `);
  }

  private async shouldPersistDetails() {
    return this.featureFlagService.isEnabled(FeatureFlag.AI_VACANCY_PERSISTENCE);
  }
}
