import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DrizzleProvider } from '../common/database/drizzle.module';
import { NotificationFactory } from '../notification/notification-factory';
import { TaskService } from './task.service';

describe('TaskService.create', () => {
  let service: TaskService;
  const returning = vi.fn();
  const values = vi.fn(() => ({ returning }));
  const insert = vi.fn(() => ({ values }));
  const mockDb = { insert } as unknown as Record<string, unknown>;
  const ensure = vi.fn();
  const notificationFactory = { ensure } as unknown as NotificationFactory;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: DrizzleProvider, useValue: mockDb },
        { provide: NotificationFactory, useValue: notificationFactory },
      ],
    }).compile();
    service = module.get<TaskService>(TaskService);
  });

  it('inserts a standalone Task with createdBy + organizationId', async () => {
    returning.mockResolvedValueOnce([
      {
        id: 1,
        title: 'Llamar al abogado',
        assignedTo: 7,
        organizationId: 42,
      },
    ]);
    const result = await service.create({
      title: 'Llamar al abogado',
      assignedTo: 7,
      createdBy: 7,
      organizationId: 42,
    });

    expect(insert).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Llamar al abogado',
        assignedTo: 7,
        createdBy: 7,
        organizationId: 42,
        candidateId: null,
        vacancyId: null,
        companyId: null,
        dueDate: null,
      }),
    );
    expect(result).toEqual({
      id: 1,
      title: 'Llamar al abogado',
      assignedTo: 7,
      organizationId: 42,
    });
  });

  it('rejects a Task with more than one attachment target', async () => {
    await expect(
      service.create({
        title: 'mixed',
        assignedTo: 7,
        createdBy: 7,
        organizationId: 42,
        candidateId: 1,
        vacancyId: 2,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(insert).not.toHaveBeenCalled();
  });

  it('creates exactly one assigned Notification when assigning to another User on create', async () => {
    returning.mockResolvedValueOnce([
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
    returning.mockResolvedValueOnce([
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

describe('TaskService.update — assignment Notification', () => {
  let service: TaskService;
  const findFirst = vi.fn();
  const returning = vi.fn();
  const where = vi.fn(() => ({ returning }));
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));
  const mockDb = {
    query: { tasks: { findFirst } },
    update,
  } as unknown as Record<string, unknown>;
  const ensure = vi.fn();
  const notificationFactory = { ensure } as unknown as NotificationFactory;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: DrizzleProvider, useValue: mockDb },
        { provide: NotificationFactory, useValue: notificationFactory },
      ],
    }).compile();
    service = module.get<TaskService>(TaskService);
  });

  it('reassigning a Task to a different User notifies the new owner', async () => {
    findFirst.mockResolvedValueOnce({
      id: 5,
      organizationId: 42,
      assignedTo: 7,
      candidateId: null,
      vacancyId: null,
      companyId: null,
    });
    returning.mockResolvedValueOnce([
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
    findFirst.mockResolvedValueOnce({
      id: 5,
      organizationId: 42,
      assignedTo: 7,
      candidateId: null,
      vacancyId: null,
      companyId: null,
    });
    returning.mockResolvedValueOnce([
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
    findFirst.mockResolvedValueOnce({
      id: 5,
      organizationId: 42,
      assignedTo: 7,
      candidateId: null,
      vacancyId: null,
      companyId: null,
    });
    returning.mockResolvedValueOnce([
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
    findFirst.mockResolvedValueOnce({
      id: 5,
      organizationId: 42,
      assignedTo: 7,
      candidateId: null,
      vacancyId: null,
      companyId: null,
    });
    returning.mockResolvedValueOnce([
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

describe('TaskService.complete / reopen', () => {
  let service: TaskService;
  const findFirst = vi.fn();
  const returning = vi.fn();
  const where = vi.fn(() => ({ returning }));
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));
  const mockDb = {
    query: { tasks: { findFirst } },
    update,
  } as unknown as Record<string, unknown>;
  const ensure = vi.fn();
  const notificationFactory = { ensure } as unknown as NotificationFactory;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: DrizzleProvider, useValue: mockDb },
        { provide: NotificationFactory, useValue: notificationFactory },
      ],
    }).compile();
    service = module.get<TaskService>(TaskService);
  });

  it('complete sets completed, completedAt, completedBy', async () => {
    findFirst.mockResolvedValueOnce({ id: 1, organizationId: 42 });
    returning.mockResolvedValueOnce([
      {
        id: 1,
        completed: true,
        completedAt: new Date(),
        completedBy: 9,
      },
    ]);

    const result = await service.complete(1, 42, 9);

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        completed: true,
        completedBy: 9,
        completedAt: expect.any(Date),
      }),
    );
    expect(result.completedBy).toBe(9);
    expect(result.completed).toBe(true);
    expect(result.completedAt).toBeInstanceOf(Date);
  });

  it('reopen clears completed, completedAt, completedBy', async () => {
    findFirst.mockResolvedValueOnce({
      id: 1,
      organizationId: 42,
      completed: true,
    });
    returning.mockResolvedValueOnce([
      { id: 1, completed: false, completedAt: null, completedBy: null },
    ]);

    const result = await service.reopen(1, 42);

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        completed: false,
        completedAt: null,
        completedBy: null,
      }),
    );
    expect(result.completed).toBe(false);
    expect(result.completedAt).toBeNull();
    expect(result.completedBy).toBeNull();
  });
});
