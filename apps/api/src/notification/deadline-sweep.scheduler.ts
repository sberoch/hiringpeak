import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, isNotNull, lte } from 'drizzle-orm';
import { tasks } from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { DeadlineSweep } from './deadline-sweep';
import { NotificationFactory } from './notification-factory';

/**
 * Thin adapter that implements ADR-0001: an in-process hourly cron that hands
 * the open, deadline-bearing Tasks of *every* Organization to `DeadlineSweep`
 * and persists the resulting intents through `NotificationFactory`.
 *
 * Deliberately runs **without CLS**, therefore without an `organizationId` —
 * it is a platform-level job, not a per-tenant request. The dedup rule in
 * `NotificationFactory` is what makes it safe under crash/restart/double-fire.
 */
@Injectable()
export class DeadlineSweepScheduler {
  private readonly logger = new Logger(DeadlineSweepScheduler.name);

  constructor(
    @Inject(DrizzleProvider) private readonly db: DrizzleDatabase,
    private readonly notificationFactory: NotificationFactory,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async runHourly(): Promise<void> {
    await this.sweep(new Date());
  }

  async sweep(now: Date): Promise<void> {
    const today = formatLocalDay(now);
    const rows = await this.db
      .select({
        id: tasks.id,
        organizationId: tasks.organizationId,
        assignedTo: tasks.assignedTo,
        dueDate: tasks.dueDate,
        completed: tasks.completed,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.completed, false),
          isNotNull(tasks.dueDate),
          lte(tasks.dueDate, today),
        ),
      );

    const intents = DeadlineSweep.computeDeadlineNotifications(rows, now);
    let created = 0;
    for (const intent of intents) {
      const result = await this.notificationFactory.ensure(intent);
      if (result) created++;
    }
    this.logger.log(
      `Deadline sweep: ${rows.length} candidate Task(s), ${intents.length} intent(s), ${created} new Notification(s).`,
    );
  }
}

function formatLocalDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
