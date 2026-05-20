import type { NotificationIntent } from './notification-factory';

/**
 * Minimum Task shape the sweep needs. Kept narrow so the pure module never
 * grows a transitive dep on the schema or service layer.
 */
export type DeadlineSweepTask = {
  id: number;
  organizationId: number;
  assignedTo: number;
  /** Day-granular `YYYY-MM-DD` string, or null for backlog items. */
  dueDate: string | null;
  completed: boolean;
};

/**
 * Pure decision core for time-driven Notifications: turns the current set of
 * Tasks into the `due`/`overdue` intents that *should* exist right now. No
 * DB, no CLS, no cron — those are adapter concerns (`DeadlineSweepScheduler`).
 *
 * Idempotency under repeated sweeps/crashes/double-fires comes from the
 * `(taskId, kind, recipientUserId)` dedup rule in `NotificationFactory`, not
 * from this module. This module's contract is just: given the same inputs, it
 * always emits the same intents (deterministic and history-free).
 *
 * Day-granular semantics, per ADR-0001:
 *   - `dueDate === today` && !completed → `due`
 *   - `dueDate <  today` && !completed → `overdue`
 *   - everything else → silent (no `dueDate`, completed, or future-dated).
 *
 * The recipient is always the current `assignedTo` — reassignment is reflected
 * naturally on the next sweep without history input.
 */
export class DeadlineSweep {
  static computeDeadlineNotifications(
    tasks: DeadlineSweepTask[],
    now: Date,
  ): NotificationIntent[] {
    const today = formatLocalDay(now);
    const intents: NotificationIntent[] = [];
    for (const t of tasks) {
      if (t.completed) continue;
      if (!t.dueDate) continue;
      const kind =
        t.dueDate < today ? 'overdue' : t.dueDate === today ? 'due' : null;
      if (!kind) continue;
      intents.push({
        taskId: t.id,
        organizationId: t.organizationId,
        recipientUserId: t.assignedTo,
        kind,
      });
    }
    return intents;
  }
}

function formatLocalDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
