import { stageOutcome } from '@workspace/shared/lib/opportunity-stage';
import { Inject, Injectable } from '@nestjs/common';
import { count, eq, inArray, gte, lt, and, sql, avg } from 'drizzle-orm';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import {
  CommercialSummary,
  Dashboard,
  RecruiterStats,
} from '@workspace/shared/types/dashboard';
import {
  candidates,
  candidateVacancies,
  opportunities,
  opportunityStages,
  users,
  vacancies,
  vacancyStatuses,
} from '@workspace/shared/schemas';
import { computeCommercialSummary } from './commercial-metrics';

const FILLED_STATUS_NAMES = ['Cubierta', 'Filled'];
const CANCELLED_STATUS_NAMES = ['Cancelada', 'Cancelled'];

/**
 * How a closed (final) Vacancy ended, for fill rate and time-to-fill only.
 * `isFinal` says a Vacancy is closed but not whether it was filled or
 * cancelled, and no other flag does, so this is the one place the dashboard
 * still reads a Vacancy Status name. Open/closed everywhere else is `isFinal`.
 * A final status with any other name counts toward neither.
 */
function finalOutcome(status: {
  name: string;
  isFinal: boolean;
}): 'filled' | 'cancelled' | null {
  if (!status.isFinal) return null;
  if (FILLED_STATUS_NAMES.includes(status.name)) return 'filled';
  if (CANCELLED_STATUS_NAMES.includes(status.name)) return 'cancelled';
  return null;
}

@Injectable()
export class DashboardService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async getDashboard(organizationId: number): Promise<Dashboard> {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      activeCandidates,
      activeVacancies,
      monthlyCandidates,
      monthlyVacancies,
      avgDaysOpenResult,
    ] = await Promise.all([
      this.db
        .select({ count: count(candidates.id) })
        .from(candidates)
        .where(
          and(
            eq(candidates.organizationId, organizationId),
            eq(candidates.deleted, false),
          ),
        ),
      this.db
        .select({ count: count(vacancies.id) })
        .from(vacancies)
        .innerJoin(vacancyStatuses, eq(vacancyStatuses.id, vacancies.statusId))
        .where(
          and(
            eq(vacancies.organizationId, organizationId),
            eq(vacancyStatuses.isFinal, false),
          ),
        ),
      this.db
        .select({ count: count(candidates.id) })
        .from(candidates)
        .where(
          and(
            eq(candidates.organizationId, organizationId),
            eq(candidates.deleted, false),
            gte(candidates.createdAt, currentMonthStart),
            lt(candidates.createdAt, nextMonthStart),
          ),
        ),
      this.db
        .select({ count: count(vacancies.id) })
        .from(vacancies)
        .where(
          and(
            eq(vacancies.organizationId, organizationId),
            gte(vacancies.createdAt, currentMonthStart),
            lt(vacancies.createdAt, nextMonthStart),
          ),
        ),
      this.db
        .select({
          avg: avg(
            sql`EXTRACT(EPOCH FROM (NOW() - ${vacancies.createdAt})) / 86400`,
          ),
        })
        .from(vacancies)
        .innerJoin(vacancyStatuses, eq(vacancyStatuses.id, vacancies.statusId))
        .where(
          and(
            eq(vacancies.organizationId, organizationId),
            eq(vacancyStatuses.isFinal, false),
          ),
        ),
    ]);

    return {
      activeCandidates: activeCandidates[0].count,
      activeVacancies: activeVacancies[0].count,
      monthlyCandidates: monthlyCandidates[0].count,
      monthlyVacancies: monthlyVacancies[0].count,
      avgDaysOpen: avgDaysOpenResult[0].avg
        ? Math.round(Number(avgDaysOpenResult[0].avg))
        : null,
    };
  }

  /** «Mis búsquedas activas»: open Vacancies the User is Vacancy Owner of. */
  async countMyActiveVacancies(
    organizationId: number,
    userId: number,
  ): Promise<{ count: number }> {
    const [{ count: c }] = await this.db
      .select({ count: count(vacancies.id) })
      .from(vacancies)
      .innerJoin(vacancyStatuses, eq(vacancyStatuses.id, vacancies.statusId))
      .where(
        and(
          eq(vacancies.organizationId, organizationId),
          eq(vacancies.assignedTo, userId),
          eq(vacancyStatuses.isFinal, false),
        ),
      );
    return { count: c };
  }

  /** «Candidatos agregados (últ. 30 días)»: the Organization's, not deleted. */
  async countCandidatesAddedLast30Days(
    organizationId: number,
    now = new Date(),
  ): Promise<{ count: number }> {
    const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [{ count: c }] = await this.db
      .select({ count: count(candidates.id) })
      .from(candidates)
      .where(
        and(
          eq(candidates.organizationId, organizationId),
          eq(candidates.deleted, false),
          gte(candidates.createdAt, since),
        ),
      );
    return { count: c };
  }

  async getRecruiterStats(organizationId: number): Promise<RecruiterStats[]> {
    const yearStart = new Date(new Date().getFullYear(), 0, 1);

    const statuses = await this.db
      .select({
        id: vacancyStatuses.id,
        name: vacancyStatuses.name,
        isFinal: vacancyStatuses.isFinal,
      })
      .from(vacancyStatuses)
      .where(eq(vacancyStatuses.organizationId, organizationId));
    const statusById = new Map(statuses.map((s) => [s.id, s]));

    // Get all vacancies assigned this year with recruiter info
    const recruiterVacancies = await this.db
      .select({
        vacancyId: vacancies.id,
        userId: vacancies.assignedTo,
        userName: users.name,
        statusId: vacancies.statusId,
        createdAt: vacancies.createdAt,
        updatedAt: vacancies.updatedAt,
      })
      .from(vacancies)
      .innerJoin(users, eq(users.id, vacancies.assignedTo))
      .where(
        and(
          eq(vacancies.organizationId, organizationId),
          gte(vacancies.createdAt, yearStart),
        ),
      );

    const vacancyIdList = recruiterVacancies.map((v) => v.vacancyId);

    let candidateCounts: { vacancyId: number; count: number }[] = [];
    if (vacancyIdList.length > 0) {
      candidateCounts = await this.db
        .select({
          vacancyId: candidateVacancies.vacancyId,
          count: count(candidateVacancies.id),
        })
        .from(candidateVacancies)
        .where(inArray(candidateVacancies.vacancyId, vacancyIdList))
        .groupBy(candidateVacancies.vacancyId);
    }

    // Build a map: vacancyId -> assignedTo
    const vacancyToRecruiter = new Map(
      recruiterVacancies.map((v) => [v.vacancyId, v.userId]),
    );

    // Build candidate count per recruiter
    const candidatesByRecruiter = new Map<number, number>();
    for (const cc of candidateCounts) {
      const recruiterId = vacancyToRecruiter.get(cc.vacancyId);
      if (recruiterId != null) {
        candidatesByRecruiter.set(
          recruiterId,
          (candidatesByRecruiter.get(recruiterId) || 0) + cc.count,
        );
      }
    }

    // Aggregate per recruiter
    const recruiterMap = new Map<
      number,
      {
        name: string;
        active: number;
        total: number;
        filled: number;
        resolved: number;
        fillDaysSum: number;
        fillCount: number;
        candidatesInPipeline: number;
      }
    >();

    for (const rv of recruiterVacancies) {
      let entry = recruiterMap.get(rv.userId);
      if (!entry) {
        entry = {
          name: rv.userName,
          active: 0,
          total: 0,
          filled: 0,
          resolved: 0,
          fillDaysSum: 0,
          fillCount: 0,
          candidatesInPipeline: 0,
        };
        recruiterMap.set(rv.userId, entry);
      }

      entry.total++;

      const status = rv.statusId ? statusById.get(rv.statusId) : undefined;
      if (status && !status.isFinal) {
        entry.active++;
      }

      const outcome = status ? finalOutcome(status) : null;

      if (outcome === 'filled') {
        entry.filled++;
        entry.resolved++;
        // Approximate time-to-fill using updatedAt - createdAt
        if (rv.createdAt && rv.updatedAt) {
          const days =
            (rv.updatedAt.getTime() - rv.createdAt.getTime()) /
            (1000 * 60 * 60 * 24);
          entry.fillDaysSum += days;
          entry.fillCount++;
        }
      } else if (outcome === 'cancelled') {
        entry.resolved++;
      }
    }

    // Merge candidate counts
    for (const [recruiterId, entry] of recruiterMap) {
      entry.candidatesInPipeline = candidatesByRecruiter.get(recruiterId) || 0;
    }

    const stats: RecruiterStats[] = Array.from(recruiterMap.entries()).map(
      ([userId, entry]) => ({
        userId,
        name: entry.name,
        activeVacancies: entry.active,
        totalVacancies: entry.total,
        fillRate:
          entry.resolved > 0
            ? Math.round((entry.filled / entry.resolved) * 100)
            : null,
        candidatesInPipeline: entry.candidatesInPipeline,
        avgTimeToFillDays:
          entry.fillCount > 0
            ? Math.round(entry.fillDaysSum / entry.fillCount)
            : null,
      }),
    );

    // Sort by total vacancies descending
    stats.sort((a, b) => b.totalVacancies - a.totalVacancies);

    return stats;
  }

  /** «Comercial» section: every Owner's row, scoped to the Organization. */
  async getCommercialSummary(
    organizationId: number,
    now = new Date(),
  ): Promise<CommercialSummary> {
    const rows = await this.db
      .select({
        ownerId: opportunities.ownerId,
        ownerName: users.name,
        isWon: opportunityStages.isWon,
        isLost: opportunityStages.isLost,
        estimatedFee: opportunities.estimatedFee,
        createdAt: opportunities.createdAt,
        closeDate: opportunities.closeDate,
      })
      .from(opportunities)
      .innerJoin(
        opportunityStages,
        eq(opportunityStages.id, opportunities.stageId),
      )
      .innerJoin(users, eq(users.id, opportunities.ownerId))
      .where(eq(opportunities.organizationId, organizationId));

    return computeCommercialSummary(
      rows.map(({ isWon, isLost, ...row }) => ({
        ...row,
        outcome: stageOutcome({ isWon, isLost }),
      })),
      now,
    );
  }
}
