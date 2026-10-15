import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  taskCandidacies,
  taskCandidates,
  taskCompanies,
  tasks,
  taskVacancies,
} from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import { NotificationFactory } from '../notification/notification-factory';
import { TaskService } from './task.service';

/**
 * Mocked Drizzle database. Writes run inside `transaction`, which hands the
 * same chainable mock over as `tx`. `rowsInsertedInto(table)` and
 * `wasCleared(table)` read back what the service wrote per table.
 */
function makeDb() {
  const insertedRows = new Map<unknown, unknown[]>();
  const clearedTables: unknown[] = [];
  const insertReturning = vi.fn();
  const insert = vi.fn((table: unknown) => ({
    values: vi.fn((rows: unknown) => {
      const list = Array.isArray(rows) ? rows : [rows];
      insertedRows.set(table, [...(insertedRows.get(table) ?? []), ...list]);
      return { returning: insertReturning };
    }),
  }));
  const updateReturning = vi.fn();
  const set = vi.fn(() => ({
    where: vi.fn(() => ({ returning: updateReturning })),
  }));
  const update = vi.fn(() => ({ set }));
  const del = vi.fn((table: unknown) => ({
    where: vi.fn(() => {
      clearedTables.push(table);
      return Promise.resolve();
    }),
  }));
  const findFirst = vi.fn();
  const findMany = vi.fn();
  const selectWhere = vi.fn();
  const select = vi.fn(() => ({
    from: vi.fn(() => ({ where: selectWhere })),
  }));

  const db: Record<string, unknown> = {
    insert,
    update,
    delete: del,
    select,
    query: { tasks: { findFirst, findMany } },
  };
  db.transaction = vi.fn(async (cb: (tx: unknown) => unknown) => cb(db));

  return {
    db,
    insert,
    insertReturning,
    set,
    updateReturning,
    findFirst,
    findMany,
    selectWhere,
    select,
    rowsInsertedInto: (table: unknown) => insertedRows.get(table) ?? [],
    wasCleared: (table: unknown) => clearedTables.includes(table),
  };
}

async function buildService(db: Record<string, unknown>, ensure = vi.fn()) {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      TaskService,
      { provide: DrizzleProvider, useValue: db },
      {
        provide: NotificationFactory,
        useValue: { ensure } as unknown as NotificationFactory,
      },
    ],
  }).compile();
  return module.get<TaskService>(TaskService);
}

describe('TaskService.create', () => {
  let m: ReturnType<typeof makeDb>;
  let ensure: ReturnType<typeof vi.fn>;
  let service: TaskService;

  beforeEach(async () => {
    m = makeDb();
    ensure = vi.fn();
    service = await buildService(m.db, ensure);
  });

  it('creates a standalone Task with no attachments', async () => {
    m.insertReturning.mockResolvedValueOnce([
      { id: 1, title: 'Llamar al abogado', assignedTo: 7, organizationId: 42 },
    ]);

    const result = await service.create({
      title: 'Llamar al abogado',
      assignedTo: 7,
      createdBy: 7,
      organizationId: 42,
    });

    expect(m.rowsInsertedInto(tasks)).toEqual([
      expect.objectContaining({
        title: 'Llamar al abogado',
        assignedTo: 7,
        createdBy: 7,
        organizationId: 42,
        dueDate: null,
      }),
    ]);
    expect([
      ...m.rowsInsertedInto(taskCandidates),
      ...m.rowsInsertedInto(taskVacancies),
      ...m.rowsInsertedInto(taskCandidacies),
      ...m.rowsInsertedInto(taskCompanies),
    ]).toEqual([]);
    expect(result).toMatchObject({ id: 1, title: 'Llamar al abogado' });
  });

  it('attaches a Task to several Candidates, Vacancies, Candidacies and Companies at once', async () => {
    m.insertReturning.mockResolvedValueOnce([
      { id: 9, assignedTo: 7, organizationId: 42 },
    ]);

    await service.create({
      title: 'Coordinar entrevistas',
      assignedTo: 7,
      createdBy: 7,
      organizationId: 42,
      candidateIds: [1, 2],
      vacancyIds: [3],
      candidacyIds: [4],
      companyIds: [5, 6],
    });

    expect(m.rowsInsertedInto(taskCandidates)).toEqual([
      { taskId: 9, candidateId: 1 },
      { taskId: 9, candidateId: 2 },
    ]);
    expect(m.rowsInsertedInto(taskVacancies)).toEqual([
      { taskId: 9, vacancyId: 3 },
    ]);
    expect(m.rowsInsertedInto(taskCandidacies)).toEqual([
      { taskId: 9, candidacyId: 4 },
    ]);
    expect(m.rowsInsertedInto(taskCompanies)).toEqual([
      { taskId: 9, companyId: 5 },
      { taskId: 9, companyId: 6 },
    ]);
  });

  it('attaches the same record only once when it is picked twice', async () => {
    m.insertReturning.mockResolvedValueOnce([
      { id: 9, assignedTo: 7, organizationId: 42 },
    ]);

    await service.create({
      title: 't',
      assignedTo: 7,
      createdBy: 7,
      organizationId: 42,
      candidateIds: [1, 1],
    });

    expect(m.rowsInsertedInto(taskCandidates)).toEqual([
      { taskId: 9, candidateId: 1 },
    ]);
  });

  it('creates exactly one assigned Notification when assigning to another User on create', async () => {
    m.insertReturning.mockResolvedValueOnce([
      { id: 11, assignedTo: 9, organizationId: 42 },
    ]);
    ensure.mockResolvedValueOnce({ id: 1 });

    await service.create({
      title: 'Pedir referencias',
      assignedTo: 9,
      createdBy: 7,
      organizationId: 42,
    });

    expect(ensure).toHaveBeenCalledTimes(1);
    expect(ensure).toHaveBeenCalledWith({
      recipientUserId: 9,
      organizationId: 42,
      kind: 'assigned',
      taskId: 11,
    });
  });

  it('does not create a Notification when self-creating (createdBy == assignedTo)', async () => {
    m.insertReturning.mockResolvedValueOnce([
      { id: 12, assignedTo: 7, organizationId: 42 },
    ]);

    await service.create({
      title: 'Mi tarea',
      assignedTo: 7,
      createdBy: 7,
      organizationId: 42,
    });

    expect(ensure).not.toHaveBeenCalled();
  });
});

describe('TaskService.update — attachments', () => {
  let m: ReturnType<typeof makeDb>;
  let service: TaskService;

  beforeEach(async () => {
    m = makeDb();
    service = await buildService(m.db);
    m.findFirst.mockResolvedValueOnce({
      id: 5,
      organizationId: 42,
      assignedTo: 7,
    });
    m.updateReturning.mockResolvedValueOnce([
      { id: 5, assignedTo: 7, organizationId: 42 },
    ]);
  });

  it('replaces the attachments of each type it is given', async () => {
    await service.update(5, {
      organizationId: 42,
      actorUserId: 7,
      candidateIds: [1, 2],
      vacancyIds: [3],
    });

    expect(m.wasCleared(taskCandidates)).toBe(true);
    expect(m.rowsInsertedInto(taskCandidates)).toEqual([
      { taskId: 5, candidateId: 1 },
      { taskId: 5, candidateId: 2 },
    ]);
    expect(m.wasCleared(taskVacancies)).toBe(true);
    expect(m.rowsInsertedInto(taskVacancies)).toEqual([
      { taskId: 5, vacancyId: 3 },
    ]);
  });

  it('leaves the attachments of types it is not given untouched', async () => {
    await service.update(5, {
      organizationId: 42,
      actorUserId: 7,
      candidateIds: [1],
    });

    expect(m.wasCleared(taskVacancies)).toBe(false);
    expect(m.wasCleared(taskCandidacies)).toBe(false);
    expect(m.wasCleared(taskCompanies)).toBe(false);
  });

  it('detaches every record of a type when given an empty list', async () => {
    await service.update(5, {
      organizationId: 42,
      actorUserId: 7,
      companyIds: [],
    });

    expect(m.wasCleared(taskCompanies)).toBe(true);
    expect(m.rowsInsertedInto(taskCompanies)).toEqual([]);
  });

  it('editing only the title touches no attachment', async () => {
    await service.update(5, {
      organizationId: 42,
      actorUserId: 7,
      title: 'nuevo titulo',
    });

    expect(
      [taskCandidates, taskVacancies, taskCandidacies, taskCompanies].some(
        m.wasCleared,
      ),
    ).toBe(false);
  });
});

/** A Task row as the relational query loads it, with its attachment links. */
const loadedTaskRow = {
  id: 1,
  title: 'Coordinar entrevista',
  organizationId: 42,
  assignedTo: 7,
  dueDate: '2026-05-21',
  completed: false,
  assignedToUser: { id: 7, name: 'Ana', password: 'secret' },
  createdByUser: { id: 7, name: 'Ana', password: 'secret' },
  taskCandidates: [
    { candidate: { id: 1, name: 'Martín Álvarez' } },
    { candidate: { id: 2, name: 'Lucía Fernández' } },
  ],
  taskVacancies: [{ vacancy: { id: 3, title: 'Gerente Comercial' } }],
  taskCandidacies: [
    {
      candidacy: {
        id: 4,
        candidate: { name: 'Martín Álvarez' },
        vacancy: { title: 'Gerente Comercial' },
      },
    },
  ],
  taskCompanies: [],
};

const expectedAttachments = {
  candidates: [
    { id: 1, name: 'Martín Álvarez' },
    { id: 2, name: 'Lucía Fernández' },
  ],
  vacancies: [{ id: 3, title: 'Gerente Comercial' }],
  candidacies: [
    {
      id: 4,
      candidateName: 'Martín Álvarez',
      vacancyTitle: 'Gerente Comercial',
    },
  ],
  companies: [],
};

describe('TaskService.findAll', () => {
  let m: ReturnType<typeof makeDb>;
  let service: TaskService;

  beforeEach(async () => {
    m = makeDb();
    service = await buildService(m.db);
  });

  it('lists each Task with every record it is attached to, by type', async () => {
    m.findMany.mockResolvedValueOnce([loadedTaskRow]);
    m.selectWhere.mockResolvedValueOnce([{ count: 1 }]);

    const page = await service.findAll({ organizationId: 42 });

    expect(page.items[0]).toMatchObject(expectedAttachments);
    expect(page.items[0]).not.toHaveProperty('taskCandidates');
  });

  it('strips passwords from the owner and creator', async () => {
    m.findMany.mockResolvedValueOnce([loadedTaskRow]);
    m.selectWhere.mockResolvedValueOnce([{ count: 1 }]);

    const page = await service.findAll({ organizationId: 42 });

    expect(page.items[0].assignedToUser).not.toHaveProperty('password');
    expect(page.items[0].createdByUser).not.toHaveProperty('password');
  });
});

describe('TaskService.dueSoonForUser', () => {
  let m: ReturnType<typeof makeDb>;
  let service: TaskService;

  beforeEach(async () => {
    m = makeDb();
    service = await buildService(m.db);
  });

  it('returns at most 10 Tasks', async () => {
    m.findMany.mockResolvedValueOnce([]);

    await service.dueSoonForUser(42, 7, 7, new Date('2026-05-20T10:00:00Z'));

    expect(m.findMany.mock.calls[0][0].limit).toBe(10);
  });

  it('returns each Task with its attachments and without the owner password', async () => {
    m.findMany.mockResolvedValueOnce([loadedTaskRow]);

    const items = await service.dueSoonForUser(42, 7);

    expect(items[0]).toMatchObject(expectedAttachments);
    expect(items[0].assignedToUser).not.toHaveProperty('password');
    expect(items[0].assignedToUser).toMatchObject({ id: 7, name: 'Ana' });
  });
});

describe('TaskService.openCountFor', () => {
  let m: ReturnType<typeof makeDb>;
  let service: TaskService;

  beforeEach(async () => {
    m = makeDb();
    service = await buildService(m.db);
  });

  it("returns the count of the User's open owned Tasks for the Organization", async () => {
    m.selectWhere.mockResolvedValueOnce([{ count: 3 }]);

    expect(await service.openCountFor(42, 7)).toEqual({ count: 3 });
  });

  it('returns zero when the User has no open owned Tasks', async () => {
    m.selectWhere.mockResolvedValueOnce([{ count: 0 }]);

    expect(await service.openCountFor(42, 7)).toEqual({ count: 0 });
  });
});

describe('TaskService.complete / reopen', () => {
  let m: ReturnType<typeof makeDb>;
  let service: TaskService;

  beforeEach(async () => {
    m = makeDb();
    service = await buildService(m.db);
  });

  it('complete sets completed, completedAt, completedBy', async () => {
    m.findFirst.mockResolvedValueOnce({ id: 1, organizationId: 42 });
    m.updateReturning.mockResolvedValueOnce([
      { id: 1, completed: true, completedAt: new Date(), completedBy: 9 },
    ]);

    await service.complete(1, 42, 9);

    expect(m.set).toHaveBeenCalledWith(
      expect.objectContaining({
        completed: true,
        completedBy: 9,
        completedAt: expect.any(Date),
      }),
    );
  });

  it('reopen clears completed, completedAt, completedBy', async () => {
    m.findFirst.mockResolvedValueOnce({
      id: 1,
      organizationId: 42,
      completed: true,
    });
    m.updateReturning.mockResolvedValueOnce([
      { id: 1, completed: false, completedAt: null, completedBy: null },
    ]);

    await service.reopen(1, 42);

    expect(m.set).toHaveBeenCalledWith(
      expect.objectContaining({
        completed: false,
        completedAt: null,
        completedBy: null,
      }),
    );
  });
});

describe('TaskService.update — assignment Notification', () => {
  let m: ReturnType<typeof makeDb>;
  let ensure: ReturnType<typeof vi.fn>;
  let service: TaskService;

  beforeEach(async () => {
    m = makeDb();
    ensure = vi.fn();
    service = await buildService(m.db, ensure);
    m.findFirst.mockResolvedValueOnce({
      id: 5,
      organizationId: 42,
      assignedTo: 7,
    });
  });

  it('reassigning a Task to a different User notifies the new owner', async () => {
    m.updateReturning.mockResolvedValueOnce([
      { id: 5, assignedTo: 9, organizationId: 42 },
    ]);

    await service.update(5, {
      organizationId: 42,
      actorUserId: 7,
      assignedTo: 9,
    });

    expect(ensure).toHaveBeenCalledWith({
      recipientUserId: 9,
      organizationId: 42,
      kind: 'assigned',
      taskId: 5,
    });
  });

  it('reassigning to the acting User (self) creates no Notification', async () => {
    m.updateReturning.mockResolvedValueOnce([
      { id: 5, assignedTo: 3, organizationId: 42 },
    ]);

    await service.update(5, {
      organizationId: 42,
      actorUserId: 3,
      assignedTo: 3,
    });

    expect(ensure).not.toHaveBeenCalled();
  });

  it('editing a Task without changing assignedTo creates no Notification', async () => {
    m.updateReturning.mockResolvedValueOnce([
      { id: 5, assignedTo: 7, organizationId: 42 },
    ]);

    await service.update(5, {
      organizationId: 42,
      actorUserId: 7,
      title: 'nuevo titulo',
    });

    expect(ensure).not.toHaveBeenCalled();
  });

  it('reassigning to the same owner (no-op) creates no Notification', async () => {
    m.updateReturning.mockResolvedValueOnce([
      { id: 5, assignedTo: 7, organizationId: 42 },
    ]);

    await service.update(5, {
      organizationId: 42,
      actorUserId: 3,
      assignedTo: 7,
    });

    expect(ensure).not.toHaveBeenCalled();
  });
});
