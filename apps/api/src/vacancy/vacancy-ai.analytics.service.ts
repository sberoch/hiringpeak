import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  aiVacancyRunEvents,
  aiVacancyRuns,
} from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { and, eq, sql } from 'drizzle-orm';
import { FeatureFlagService } from '../feature-flag/feature-flag.service';
import { FeatureFlag } from '../feature-flag/feature-flag.enum';
import type {
  AiVacancyDraft,
  VacancyAiRunEventType,
} from '@workspace/shared/types/vacancy-ai';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

interface CreateAiVacancyRunParams {
  publicToken: string;
  organizationId: number;
  userId: number;
  prompt: string;
  model: string;
  status: 'succeeded' | 'failed';
  responseText?: string;
  draft?: AiVacancyDraft;
  extractionMetadata?: JsonValue;
  totalUsage?: JsonValue;
  errorMessage?: string;
  latencyMs: number;
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
              }
            : {
                errorMessage: params.errorMessage ?? 'Unknown extraction error',
              },
      });
    }

    return run;
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
