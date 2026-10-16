import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { PermissionCode } from '@workspace/shared/enums';
import { fixtures } from '../common/database/testing/fixtures';
import { createTestDatabase } from '../common/database/testing/test-database';
import { testServices } from '../common/database/testing/test-services';
import type { TaskService } from '../task/task.service';
import type { NotificationService } from './notification.service';

/**
 * Notifications about commercial Tasks don't reach a recipient without
 * commercial access: not listed, and not readable or dismissable by id.
 */
let notifications: NotificationService;
let tasks: TaskService;
let f: ReturnType<typeof fixtures>;
let org: number;
let partner: number;
let recruiter: number;

beforeEach(async () => {
  const db = await createTestDatabase();
  ({ notifications, tasks } = await testServices(db));
  f = fixtures(db);
  org = await f.organization();
  partner = await f.user(org, [PermissionCode.CRM_MANAGE]);
  recruiter = await f.user(org, [PermissionCode.TASK_READ]);
});

/** Assigns the recruiter a Task, which notifies them; returns the Notification id. */
async function notifyRecruiter(ids: Record<string, number[]> = {}) {
  await tasks.create({
    title: 't',
    assignedTo: recruiter,
    createdBy: partner,
    organizationId: org,
    ...ids,
  });
  const [notification] = (
    await notifications.findAll({
      organizationId: org,
      recipientUserId: recruiter,
      commercialAccess: true,
    })
  ).items;
  return notification.id;
}

const recruiterView = { userId: 0, commercialAccess: false };

describe('A recipient without commercial access', () => {
  let commercial: number;
  beforeEach(async () => {
    const contact = await f.contact(org);
    commercial = await notifyRecruiter({ contactIds: [contact] });
    recruiterView.userId = recruiter;
  });

  it('cannot mark a Notification about a commercial Task as read', async () => {
    await expect(
      notifications.markRead(commercial, org, recruiterView),
    ).rejects.toThrow(NotFoundException);
  });

  it('cannot dismiss a Notification about a commercial Task', async () => {
    await expect(
      notifications.dismiss(commercial, org, recruiterView),
    ).rejects.toThrow(NotFoundException);
  });

  it('can mark a Notification about any other Task as read', async () => {
    const other = await notifyRecruiter();
    expect(
      (await notifications.markRead(other, org, recruiterView)).readAt,
    ).toBeInstanceOf(Date);
  });
});
