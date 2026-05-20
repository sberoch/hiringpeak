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
        candidateVacancyId: null,
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
