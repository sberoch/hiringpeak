import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DrizzleProvider } from '../common/database/drizzle.module';
import { TaskService } from './task.service';

describe('TaskService.create', () => {
  let service: TaskService;
  const returning = vi.fn();
  const values = vi.fn(() => ({ returning }));
  const insert = vi.fn(() => ({ values }));
  const mockDb = { insert } as unknown as Record<string, unknown>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: DrizzleProvider, useValue: mockDb },
      ],
    }).compile();
    service = module.get<TaskService>(TaskService);
  });

  it('inserts a standalone Task with createdBy + organizationId', async () => {
    returning.mockResolvedValueOnce([{ id: 1, title: 'Llamar al abogado' }]);
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
    expect(result).toEqual({ id: 1, title: 'Llamar al abogado' });
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

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: DrizzleProvider, useValue: mockDb },
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
