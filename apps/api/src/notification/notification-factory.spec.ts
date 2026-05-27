import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DrizzleProvider } from '../common/database/drizzle.module';
import { NotificationFactory } from './notification-factory';

describe('NotificationFactory.ensure', () => {
  let factory: NotificationFactory;
  const findFirst = vi.fn();
  const returning = vi.fn();
  const values = vi.fn(() => ({ returning }));
  const insert = vi.fn(() => ({ values }));
  const mockDb = {
    query: { notifications: { findFirst } },
    insert,
  } as unknown as Record<string, unknown>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationFactory,
        { provide: DrizzleProvider, useValue: mockDb },
      ],
    }).compile();
    factory = module.get<NotificationFactory>(NotificationFactory);
  });

  it('creates a Notification when no unread duplicate exists', async () => {
    findFirst.mockResolvedValueOnce(undefined);
    returning.mockResolvedValueOnce([
      { id: 1, taskId: 10, kind: 'assigned', recipientUserId: 5 },
    ]);

    const result = await factory.ensure({
      taskId: 10,
      kind: 'assigned',
      recipientUserId: 5,
      organizationId: 42,
    });

    expect(insert).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 10,
        kind: 'assigned',
        recipientUserId: 5,
        organizationId: 42,
      }),
    );
    expect(result).not.toBeNull();
    expect(result?.id).toBe(1);
  });

  it('skips insert when an unread Notification with the same (task, kind, recipient) triple already exists', async () => {
    findFirst.mockResolvedValueOnce({
      id: 99,
      taskId: 10,
      kind: 'assigned',
      recipientUserId: 5,
      readAt: null,
    });

    const result = await factory.ensure({
      taskId: 10,
      kind: 'assigned',
      recipientUserId: 5,
      organizationId: 42,
    });

    expect(insert).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('treats different kinds as distinct (same task, same recipient, different kind)', async () => {
    findFirst.mockResolvedValueOnce(undefined);
    returning.mockResolvedValueOnce([{ id: 2, kind: 'overdue' }]);

    const result = await factory.ensure({
      taskId: 10,
      kind: 'overdue',
      recipientUserId: 5,
      organizationId: 42,
    });

    expect(insert).toHaveBeenCalledTimes(1);
    expect(result?.id).toBe(2);
  });

  it('treats different recipients as distinct (same task, same kind, different recipient)', async () => {
    findFirst.mockResolvedValueOnce(undefined);
    returning.mockResolvedValueOnce([
      { id: 3, recipientUserId: 99 },
    ]);

    const result = await factory.ensure({
      taskId: 10,
      kind: 'assigned',
      recipientUserId: 99,
      organizationId: 42,
    });

    expect(insert).toHaveBeenCalledTimes(1);
    expect(result?.id).toBe(3);
  });
});
