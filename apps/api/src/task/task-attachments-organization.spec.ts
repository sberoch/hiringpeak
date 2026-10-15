import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { PermissionCode } from '@workspace/shared/enums';
import { taskCompanies } from '@workspace/shared/schemas';
import { fixtures } from '../common/database/testing/fixtures';
import { createTestDatabase } from '../common/database/testing/test-database';
import { testServices } from '../common/database/testing/test-services';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import type { TaskService } from './task.service';

/** A Task only ever attaches to records of its own Organization. */
describe('Task attachments across Organizations', () => {
  let db: DrizzleDatabase;
  let tasks: TaskService;
  let f: ReturnType<typeof fixtures>;
  let org: number;
  let user: number;
  let other: Record<string, number>;

  beforeEach(async () => {
    db = await createTestDatabase();
    tasks = (await testServices(db)).tasks;
    f = fixtures(db);
    org = await f.organization();
    user = await f.user(org, [PermissionCode.CRM_MANAGE]);

    const otherOrg = await f.organization();
    const otherUser = await f.user(otherOrg, []);
    const companyId = await f.company(otherOrg, { name: 'Ajena SA' });
    const stages = await f.stages(otherOrg);
    const vacancyId = await f.vacancy(otherOrg, {
      companyId,
      createdBy: otherUser,
    });
    const candidateId = await f.candidate(otherOrg);
    other = {
      companyIds: companyId,
      vacancyIds: vacancyId,
      candidateIds: candidateId,
      candidacyIds: await f.candidacy(otherOrg, { candidateId, vacancyId }),
      contactIds: await f.contact(otherOrg, { companyId }),
      opportunityIds: await f.opportunity(otherOrg, {
        companyId,
        ownerId: otherUser,
        stageId: stages.open,
      }),
    };
  });

  const listAll = () =>
    tasks.findAll({ organizationId: org, commercialAccess: true });

  it.each([
    'candidateIds',
    'vacancyIds',
    'candidacyIds',
    'companyIds',
    'contactIds',
    'opportunityIds',
  ])('rejects creating a Task with %s of another Organization', async (key) => {
    await expect(
      tasks.create({
        title: 't',
        assignedTo: user,
        createdBy: user,
        organizationId: org,
        [key]: [other[key]],
      }),
    ).rejects.toThrow(NotFoundException);
    expect((await listAll()).items).toEqual([]);
  });

  it("rejects re-attaching a Task to another Organization's record", async () => {
    const own = await f.company(org, { name: 'Propia SA' });
    const task = await tasks.create({
      title: 't',
      assignedTo: user,
      createdBy: user,
      organizationId: org,
      companyIds: [own],
    });

    await expect(
      tasks.update(task.id, {
        organizationId: org,
        actorUserId: user,
        companyIds: [other.companyIds],
      }),
    ).rejects.toThrow(NotFoundException);
    expect((await listAll()).items[0].companies).toEqual([
      { id: own, name: 'Propia SA' },
    ]);
  });

  it("never lists another Organization's record among a Task's attachments", async () => {
    const task = await tasks.create({
      title: 't',
      assignedTo: user,
      createdBy: user,
      organizationId: org,
    });
    // A stray link written before attachments were validated.
    await db
      .insert(taskCompanies)
      .values({ taskId: task.id, companyId: other.companyIds });

    expect((await listAll()).items[0].companies).toEqual([]);
  });
});
