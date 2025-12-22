import { Inject, Injectable } from '@nestjs/common';
import { count, eq, inArray, gte, lt, and } from 'drizzle-orm';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { Dashboard } from '@workspace/shared/types/dashboard';
import {
  candidates,
  vacancies,
  vacancyStatuses,
} from '@workspace/shared/schemas';

const OPEN_STATUS_POSSIBLE_VALUES = ['Abierta', 'Abierto', 'Open'];

@Injectable()
export class DashboardService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async getDashboard(): Promise<Dashboard> {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const activeCandidates = await this.db
      .select({
        count: count(candidates.id),
      })
      .from(candidates)
      .where(eq(candidates.deleted, false));

    const activeVacancies = await this.db
      .select({
        count: count(vacancies.id),
      })
      .from(vacancies)
      .fullJoin(vacancyStatuses, eq(vacancyStatuses.id, vacancies.statusId))
      .where(inArray(vacancyStatuses.name, OPEN_STATUS_POSSIBLE_VALUES));

    const monthlyCandidates = await this.db
      .select({
        count: count(candidates.id),
      })
      .from(candidates)
      .where(
        and(
          eq(candidates.deleted, false),
          gte(candidates.createdAt, currentMonthStart),
          lt(candidates.createdAt, nextMonthStart),
        ),
      );

    const monthlyVacancies = await this.db
      .select({
        count: count(vacancies.id),
      })
      .from(vacancies)
      .where(
        and(
          gte(vacancies.createdAt, currentMonthStart),
          lt(vacancies.createdAt, nextMonthStart),
        ),
      );

    const dashboard: Dashboard = {
      activeCandidates: activeCandidates[0].count,
      activeVacancies: activeVacancies[0].count,
      monthlyCandidates: monthlyCandidates[0].count,
      monthlyVacancies: monthlyVacancies[0].count,
    };

    return dashboard;
  }
}
