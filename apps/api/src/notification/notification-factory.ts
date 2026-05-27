import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import {
  notifications,
  type NewNotification,
  type Notification,
} from '@workspace/shared/schemas';
import { NotificationKind } from '@workspace/shared/dtos';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';

export type NotificationIntent = {
  recipientUserId: number;
  organizationId: number;
  kind: NotificationKind;
  taskId: number;
};

/**
 * Sole chokepoint for Notification creation. Applies the
 * `(taskId, kind, recipientUserId)` dedup rule before persisting.
 *
 * Dedup window = "any existing unread Notification with the same triple".
 * Once read or dismissed (dismiss = delete), a fresh signal is allowed —
 * which is how reassignment to an already-notified recipient legitimately
 * produces a new Notification.
 */
@Injectable()
export class NotificationFactory {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async ensure(intent: NotificationIntent): Promise<Notification | null> {
    const existing = await this.db.query.notifications.findFirst({
      where: and(
        eq(notifications.taskId, intent.taskId),
        eq(notifications.kind, intent.kind),
        eq(notifications.recipientUserId, intent.recipientUserId),
        isNull(notifications.readAt),
      ),
    });
    if (existing) return null;

    const [created] = await this.db
      .insert(notifications)
      .values({
        recipientUserId: intent.recipientUserId,
        organizationId: intent.organizationId,
        kind: intent.kind,
        taskId: intent.taskId,
      } as NewNotification)
      .returning();
    return created;
  }
}
