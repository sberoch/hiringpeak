import { Inject, Injectable } from '@nestjs/common';
import { count, eq, inArray, gte, lt, and, sql, avg } from 'drizzle-orm';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { Dashboard, RecruiterStats } from '@workspace/shared/types/dashboard';
import {
  candidates,
  candidateVacancies,
  users,
  vacancies,
  vacancyStatuses,
} from '@workspace/shared/schemas';

const OPEN_STATUS_POSSIBLE_VALUES = ['Abierta', 'Abierto', 'Open'];
const FILLED_STATUS_POSSIBLE_VALUES = ['Cubierta', 'Filled'];
const CANCELLED_STATUS_POSSIBLE_VALUES = ['Cancelada', 'Cancelled'];

@Injectable()
export class DashboardService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async getDashboard(): Promise<Dashboard> {
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
        .where(eq(candidates.deleted, false)),
      this.db
        .select({ count: count(vacancies.id) })
        .from(vacancies)
        .fullJoin(vacancyStatuses, eq(vacancyStatuses.id, vacancies.statusId))
        .where(inArray(vacancyStatuses.name, OPEN_STATUS_POSSIBLE_VALUES)),
      this.db
        .select({ count: count(candidates.id) })
        .from(candidates)
        .where(
          and(
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
        .where(inArray(vacancyStatuses.name, OPEN_STATUS_POSSIBLE_VALUES)),
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

  async getRecruiterStats(): Promise<RecruiterStats[]> {
    const yearStart = new Date(new Date().getFullYear(), 0, 1);

    // Get all vacancy statuses to classify them
    const allStatuses = await this.db
      .select({ id: vacancyStatuses.id, name: vacancyStatuses.name })
      .from(vacancyStatuses);

    const openStatusIds = allStatuses
      .filter((s) => OPEN_STATUS_POSSIBLE_VALUES.includes(s.name))
      .map((s) => s.id);
    const filledStatusIds = allStatuses
      .filter((s) => FILLED_STATUS_POSSIBLE_VALUES.includes(s.name))
      .map((s) => s.id);
    const cancelledStatusIds = allStatuses
      .filter((s) => CANCELLED_STATUS_POSSIBLE_VALUES.includes(s.name))
      .map((s) => s.id);

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
      .where(gte(vacancies.createdAt, yearStart));

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

      if (rv.statusId && openStatusIds.includes(rv.statusId)) {
        entry.active++;
      }

      const isFilled = rv.statusId && filledStatusIds.includes(rv.statusId);
      const isCancelled =
        rv.statusId && cancelledStatusIds.includes(rv.statusId);

      if (isFilled) {
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
      } else if (isCancelled) {
        entry.resolved++;
      }
    }

    // Merge candidate counts
    for (const [recruiterId, entry] of recruiterMap) {
      entry.candidatesInPipeline =
        candidatesByRecruiter.get(recruiterId) || 0;
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
}
