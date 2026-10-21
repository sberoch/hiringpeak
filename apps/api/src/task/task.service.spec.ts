import { beforeEach, describe, expect, it } from 'vitest';
import { PermissionCode } from '@workspace/shared/enums';
import { fixtures } from '../common/database/testing/fixtures';
import { createTestDatabase } from '../common/database/testing/test-database';
import { testServices } from '../common/database/testing/test-services';
import type { NotificationService } from '../notification/notification.service';
import { TaskService } from './task.service';

/**
 * TaskService against the in-memory test database: Tasks are written through
 * create/update/complete/reopen and read back through findAll, dueSoonForUser
 * and openCountFor; Notifications through NotificationService.
 */
let tasks: TaskService;
let notifications: NotificationService;
let f: ReturnType<typeof fixtures>;
let org: number;
let ana: number;
let beto: number;

beforeEach(async () => {
  const db = await createTestDatabase();
  ({ tasks, notifications } = await testServices(db));
  f = fixtures(db);
  org = await f.organization();
  ana = await f.user(org, [PermissionCode.CRM_MANAGE], 'Ana');
  beto = await f.user(org, [], 'Beto');
});

const newTask = (fields: Record<string, unknown> = {}) =>
  tasks.create({
    title: 'Llamar al abogado',
    assignedTo: ana,
    createdBy: ana,
    organizationId: org,
    ...fields,
  });

const listed = async (params: Record<string, unknown> = {}) =>
  (
    await tasks.findAll({
      organizationId: org,
      commercialAccess: true,
      ...params,
    })
  ).items;

const onlyListed = async () => (await listed())[0];

const inboxOf = async (userId: number) =>
  (
    await notifications.findAll({
      organizationId: org,
      recipientUserId: userId,
      commercialAccess: true,
    })
  ).items;

/** Records of every attachable type, in the Organization. */
async function records() {
  const company = await f.company(org, { name: 'Acme' });
  const vacancy = await f.vacancy(org, {
    companyId: company,
    createdBy: ana,
    title: 'Gerente Comercial',
  });
  const candidate = await f.candidate(org, 'Martín Álvarez');
  const candidacy = await f.candidacy(org, {
    candidateId: candidate,
    vacancyId: vacancy,
  });
  const stages = await f.stages(org);
  const opportunity = await f.opportunity(org, {
    companyId: company,
    ownerId: ana,
    stageId: stages.open,
    title: 'CFO Acme',
  });
  const contact = await f.contact(org, {
    companyId: company,
    name: 'Juan Pérez',
  });
  return { company, vacancy, candidate, candidacy, opportunity, contact };
}

describe('TaskService.create', () => {
  it('creates a standalone Task with no attachments', async () => {
    await newTask();
    expect(await onlyListed()).toMatchObject({
      title: 'Llamar al abogado',
      assignedTo: ana,
      dueDate: null,
      candidates: [],
      vacancies: [],
      candidacies: [],
      companies: [],
      contacts: [],
      opportunities: [],
    });
  });

  it('attaches a Task to records of every type at once', async () => {
    const r = await records();
    await newTask({
      candidateIds: [r.candidate],
      vacancyIds: [r.vacancy],
      candidacyIds: [r.candidacy],
      companyIds: [r.company],
      opportunityIds: [r.opportunity],
      contactIds: [r.contact],
    });

    expect(await onlyListed()).toMatchObject({
      candidates: [{ id: r.candidate, name: 'Martín Álvarez' }],
      vacancies: [{ id: r.vacancy, title: 'Gerente Comercial' }],
      candidacies: [
        {
          id: r.candidacy,
          candidateName: 'Martín Álvarez',
          vacancyTitle: 'Gerente Comercial',
        },
      ],
      companies: [{ id: r.company, name: 'Acme' }],
      opportunities: [{ id: r.opportunity, title: 'CFO Acme' }],
      contacts: [{ id: r.contact, name: 'Juan Pérez' }],
    });
  });

  it('attaches several records of one type', async () => {
    const acme = await f.company(org, { name: 'Acme' });
    const globex = await f.company(org, { name: 'Globex' });
    await newTask({ companyIds: [acme, globex] });

    expect((await onlyListed()).companies).toEqual(
      expect.arrayContaining([
        { id: acme, name: 'Acme' },
        { id: globex, name: 'Globex' },
      ]),
    );
  });

  it('attaches the same record only once when it is picked twice', async () => {
    const candidate = await f.candidate(org, 'Martín Álvarez');
    await newTask({ candidateIds: [candidate, candidate] });

    expect((await onlyListed()).candidates).toEqual([
      { id: candidate, name: 'Martín Álvarez' },
    ]);
  });

  it('notifies the owner when someone else creates a Task for them', async () => {
    const task = await newTask({ assignedTo: beto, createdBy: ana });

    expect(await inboxOf(beto)).toEqual([
      expect.objectContaining({ kind: 'assigned', taskId: task.id }),
    ]);
  });

  it('notifies no one when the owner creates their own Task', async () => {
    await newTask();
    expect(await inboxOf(ana)).toEqual([]);
  });
});

describe('TaskService.update — attachments', () => {
  it('replaces the attachments of each type it is given', async () => {
    const acme = await f.company(org, { name: 'Acme' });
    const globex = await f.company(org, { name: 'Globex' });
    const task = await newTask({ companyIds: [acme] });

    await tasks.update(task.id, {
      organizationId: org,
      actorUserId: ana,
      companyIds: [globex],
    });

    expect((await onlyListed()).companies).toEqual([
      { id: globex, name: 'Globex' },
    ]);
  });

  it('leaves the attachments of types it is not given untouched', async () => {
    const r = await records();
    const task = await newTask({
      companyIds: [r.company],
      vacancyIds: [r.vacancy],
    });

    await tasks.update(task.id, {
      organizationId: org,
      actorUserId: ana,
      candidateIds: [r.candidate],
    });

    expect(await onlyListed()).toMatchObject({
      companies: [{ id: r.company }],
      vacancies: [{ id: r.vacancy }],
      candidates: [{ id: r.candidate }],
    });
  });

  it('detaches every record of a type when given an empty list', async () => {
    const acme = await f.company(org);
    const task = await newTask({ companyIds: [acme] });

    await tasks.update(task.id, {
      organizationId: org,
      actorUserId: ana,
      companyIds: [],
    });

    expect((await onlyListed()).companies).toEqual([]);
  });

  it('editing only the title keeps every attachment', async () => {
    const acme = await f.company(org, { name: 'Acme' });
    const task = await newTask({ companyIds: [acme] });

    await tasks.update(task.id, {
      organizationId: org,
      actorUserId: ana,
      title: 'nuevo titulo',
    });

    expect(await onlyListed()).toMatchObject({
      title: 'nuevo titulo',
      companies: [{ id: acme, name: 'Acme' }],
    });
  });
});

describe('TaskService.findAll', () => {
  it('strips passwords from the owner and creator', async () => {
    await newTask();
    const task = await onlyListed();
    expect([task.assignedToUser, task.createdByUser]).toEqual([
      expect.not.objectContaining({ password: expect.anything() }),
      expect.not.objectContaining({ password: expect.anything() }),
    ]);
  });

  it('lists the Tasks attached to a given record, whatever else they are attached to', async () => {
    const acme = await f.company(org);
    const globex = await f.company(org);
    await newTask({ title: 'Acme', companyIds: [acme, globex] });
    await newTask({ title: 'Solo Globex', companyIds: [globex] });

    expect((await listed({ companyId: acme })).map((t) => t.title)).toEqual([
      'Acme',
    ]);
  });

  it('leaves commercial Tasks out for a caller without commercial access', async () => {
    const r = await records();
    await newTask({ title: 'Comercial', contactIds: [r.contact] });
    await newTask({ title: 'Reclutamiento', vacancyIds: [r.vacancy] });

    expect(
      (await listed({ commercialAccess: false })).map((t) => t.title),
    ).toEqual(['Reclutamiento']);
  });

  it('keeps commercial Tasks for a caller with commercial access', async () => {
    const r = await records();
    await newTask({ title: 'Comercial', opportunityIds: [r.opportunity] });

    expect((await listed()).map((t) => t.title)).toEqual(['Comercial']);
  });
});

describe('TaskService.dueSoonForUser', () => {
  const now = new Date('2026-05-20T10:00:00');

  it('returns at most 10 Tasks', async () => {
    for (let i = 0; i < 12; i++) await newTask({ dueDate: '2026-05-21' });

    const items = await tasks.dueSoonForUser(
      org,
      { userId: ana, commercialAccess: true },
      7,
      now,
    );

    expect(items).toHaveLength(10);
  });

  it('returns each Task with its attachments and without the owner password', async () => {
    const acme = await f.company(org, { name: 'Acme' });
    await newTask({ dueDate: '2026-05-21', companyIds: [acme] });

    const [item] = await tasks.dueSoonForUser(
      org,
      { userId: ana, commercialAccess: true },
      7,
      now,
    );

    expect(item).toMatchObject({
      companies: [{ id: acme, name: 'Acme' }],
      assignedToUser: { id: ana, name: 'Ana' },
    });
    expect(item.assignedToUser).not.toHaveProperty('password');
  });

  it('leaves commercial Tasks out for an owner without commercial access', async () => {
    const r = await records();
    await newTask({ dueDate: '2026-05-21', contactIds: [r.contact] });

    expect(
      await tasks.dueSoonForUser(
        org,
        { userId: ana, commercialAccess: false },
        7,
        now,
      ),
    ).toEqual([]);
  });

  it('includes commercial follow-ups for an owner with commercial access', async () => {
    const r = await records();
    await newTask({ dueDate: '2026-05-21', contactIds: [r.contact] });

    expect(
      await tasks.dueSoonForUser(
        org,
        { userId: ana, commercialAccess: true },
        7,
        now,
      ),
    ).toHaveLength(1);
  });
});

describe('TaskService.openCountFor', () => {
  it("counts the User's open owned Tasks", async () => {
    await newTask();
    await newTask();
    const done = await newTask();
    await tasks.complete(done.id, org, ana);
    await newTask({ assignedTo: beto });

    expect(
      await tasks.openCountFor(org, { userId: ana, commercialAccess: true }),
    ).toEqual({ count: 2 });
  });

  it('is zero when the User has no open owned Tasks', async () => {
    expect(
      await tasks.openCountFor(org, { userId: ana, commercialAccess: true }),
    ).toEqual({ count: 0 });
  });
});

describe('TaskService.overdueCountFor', () => {
  const now = new Date('2026-05-20T10:00:00');
  const overdueFor = (userId: number, commercialAccess = true) =>
    tasks.overdueCountFor(org, { userId, commercialAccess }, now);

  it("counts the User's own open Tasks due before today", async () => {
    await newTask({ dueDate: '2026-05-19' });
    await newTask({ dueDate: '2026-01-02' });
    await newTask({ dueDate: '2026-05-20' });
    await newTask();
    const done = await newTask({ dueDate: '2026-05-18' });
    await tasks.complete(done.id, org, ana);
    await newTask({ dueDate: '2026-05-18', assignedTo: beto });

    expect(await overdueFor(ana)).toEqual({ count: 2 });
  });

  it('leaves commercial Tasks out for an owner without commercial access', async () => {
    const r = await records();
    await newTask({ dueDate: '2026-05-18', contactIds: [r.contact] });
    await newTask({ dueDate: '2026-05-18' });

    expect(await overdueFor(ana, false)).toEqual({ count: 1 });
  });
});

describe('TaskService.complete / reopen', () => {
  it('complete records who completed it and when', async () => {
    const task = await newTask();
    await tasks.complete(task.id, org, beto);

    expect(await onlyListed()).toMatchObject({
      completed: true,
      completedBy: beto,
      completedAt: expect.any(Date),
    });
  });

  it('reopen clears the completion', async () => {
    const task = await newTask();
    await tasks.complete(task.id, org, beto);
    await tasks.reopen(task.id, org);

    expect(await onlyListed()).toMatchObject({
      completed: false,
      completedBy: null,
      completedAt: null,
    });
  });
});

describe('TaskService.update — assignment Notification', () => {
  let carla: number;
  beforeEach(async () => {
    carla = await f.user(org, [], 'Carla');
  });

  it('reassigning a Task to a different User notifies the new owner', async () => {
    const task = await newTask();
    await tasks.update(task.id, {
      organizationId: org,
      actorUserId: ana,
      assignedTo: beto,
    });

    expect(await inboxOf(beto)).toEqual([
      expect.objectContaining({ kind: 'assigned', taskId: task.id }),
    ]);
  });

  it('reassigning to the acting User notifies no one', async () => {
    const task = await newTask();
    await tasks.update(task.id, {
      organizationId: org,
      actorUserId: carla,
      assignedTo: carla,
    });

    expect(await inboxOf(carla)).toEqual([]);
  });

  it('editing a Task without changing the owner notifies no one', async () => {
    const task = await newTask();
    await tasks.update(task.id, {
      organizationId: org,
      actorUserId: carla,
      title: 'nuevo titulo',
    });

    expect(await inboxOf(ana)).toEqual([]);
  });

  it('reassigning to the same owner notifies no one', async () => {
    const task = await newTask();
    await tasks.update(task.id, {
      organizationId: org,
      actorUserId: carla,
      assignedTo: ana,
    });

    expect(await inboxOf(ana)).toEqual([]);
  });
});
