import { describe, expect, it } from 'vitest';
import { DeadlineSweep, type DeadlineSweepTask } from './deadline-sweep';

const NOW = new Date(2026, 4, 20, 9, 0, 0); // local 2026-05-20 09:00
const TODAY = '2026-05-20';
const YESTERDAY = '2026-05-19';
const LAST_WEEK = '2026-05-13';
const TOMORROW = '2026-05-21';

function task(overrides: Partial<DeadlineSweepTask> = {}): DeadlineSweepTask {
  return {
    id: 1,
    organizationId: 42,
    assignedTo: 7,
    dueDate: TODAY,
    completed: false,
    ...overrides,
  };
}

describe('DeadlineSweep.computeDeadlineNotifications', () => {
  it('returns no intents for an empty Task list', () => {
    expect(DeadlineSweep.computeDeadlineNotifications([], NOW)).toEqual([]);
  });

  it('emits a `due` intent when dueDate is today and the Task is open', () => {
    const intents = DeadlineSweep.computeDeadlineNotifications(
      [task({ id: 10, dueDate: TODAY })],
      NOW,
    );
    expect(intents).toEqual([
      {
        taskId: 10,
        organizationId: 42,
        recipientUserId: 7,
        kind: 'due',
      },
    ]);
  });

  it('emits an `overdue` intent when dueDate is in the past and the Task is open', () => {
    const intents = DeadlineSweep.computeDeadlineNotifications(
      [task({ id: 11, dueDate: YESTERDAY })],
      NOW,
    );
    expect(intents).toEqual([
      {
        taskId: 11,
        organizationId: 42,
        recipientUserId: 7,
        kind: 'overdue',
      },
    ]);
  });

  it('emits nothing for a Task with no dueDate (backlog item)', () => {
    expect(
      DeadlineSweep.computeDeadlineNotifications(
        [task({ dueDate: null })],
        NOW,
      ),
    ).toEqual([]);
  });

  it('emits nothing for a Task whose dueDate is in the future', () => {
    expect(
      DeadlineSweep.computeDeadlineNotifications(
        [task({ dueDate: TOMORROW })],
        NOW,
      ),
    ).toEqual([]);
  });

  it('emits nothing for a completed Task, even when dueDate is today or past', () => {
    const intents = DeadlineSweep.computeDeadlineNotifications(
      [
        task({ id: 1, dueDate: TODAY, completed: true }),
        task({ id: 2, dueDate: LAST_WEEK, completed: true }),
      ],
      NOW,
    );
    expect(intents).toEqual([]);
  });

  it('classifies due vs overdue independently for a mixed batch', () => {
    const intents = DeadlineSweep.computeDeadlineNotifications(
      [
        task({ id: 1, dueDate: LAST_WEEK }),
        task({ id: 2, dueDate: YESTERDAY }),
        task({ id: 3, dueDate: TODAY }),
        task({ id: 4, dueDate: TOMORROW }),
        task({ id: 5, dueDate: null }),
      ],
      NOW,
    );
    expect(intents.map((i) => [i.taskId, i.kind])).toEqual([
      [1, 'overdue'],
      [2, 'overdue'],
      [3, 'due'],
    ]);
  });

  it('is deterministic: re-running on the same inputs yields identical intents (idempotency at the pure layer)', () => {
    const tasks = [
      task({ id: 1, dueDate: YESTERDAY }),
      task({ id: 2, dueDate: TODAY, assignedTo: 9 }),
    ];
    const first = DeadlineSweep.computeDeadlineNotifications(tasks, NOW);
    const second = DeadlineSweep.computeDeadlineNotifications(tasks, NOW);
    expect(second).toEqual(first);
  });

  it('still emits the overdue intent for a self-owned Task (createdBy == assignedTo) — sweep has no actor to exclude', () => {
    // The acting-User self-action filter lives in the sync `assigned` path on
    // task.service. The sweep has no actor: a recruiter who created a Task for
    // themselves must still be notified when it goes overdue.
    const intents = DeadlineSweep.computeDeadlineNotifications(
      [task({ id: 1, dueDate: YESTERDAY, assignedTo: 7 })],
      NOW,
    );
    expect(intents).toEqual([
      {
        taskId: 1,
        organizationId: 42,
        recipientUserId: 7,
        kind: 'overdue',
      },
    ]);
  });

  it('emits one intent per Task — never duplicates `(taskId, kind, recipientUserId)` for the same Task within a sweep', () => {
    const intents = DeadlineSweep.computeDeadlineNotifications(
      [task({ id: 1, dueDate: YESTERDAY })],
      NOW,
    );
    expect(intents).toHaveLength(1);
  });

  it('targets the current assignedTo — reassigning an already-overdue Task surfaces a fresh intent for the new owner on the next sweep', () => {
    // Sweep is history-free. After reassignment from U=7 → U=9, the next
    // sweep emits an intent with recipientUserId=9. The factory then dedups
    // per `(task, kind, recipient)`: U=7's slot is untouched (stays read or
    // unread), U=9 gets a brand-new Notification.
    const before = DeadlineSweep.computeDeadlineNotifications(
      [task({ id: 1, dueDate: YESTERDAY, assignedTo: 7 })],
      NOW,
    );
    expect(before[0].recipientUserId).toBe(7);

    const after = DeadlineSweep.computeDeadlineNotifications(
      [task({ id: 1, dueDate: YESTERDAY, assignedTo: 9 })],
      NOW,
    );
    expect(after[0].recipientUserId).toBe(9);
  });

  it('reflects dueDate changes immediately — the kind tracks the current dueDate, not any prior value', () => {
    // Before: Task was overdue. After rescheduling to today, the next sweep
    // emits a `due` intent (different kind), which the factory persists as a
    // distinct Notification — that is how due-date changes regenerate.
    const overduePass = DeadlineSweep.computeDeadlineNotifications(
      [task({ id: 1, dueDate: LAST_WEEK })],
      NOW,
    );
    expect(overduePass[0].kind).toBe('overdue');

    const rescheduledPass = DeadlineSweep.computeDeadlineNotifications(
      [task({ id: 1, dueDate: TODAY })],
      NOW,
    );
    expect(rescheduledPass[0].kind).toBe('due');
  });

  it('carries each Task’s organizationId into its intent (cross-org sweep)', () => {
    const intents = DeadlineSweep.computeDeadlineNotifications(
      [
        task({ id: 1, organizationId: 100, dueDate: YESTERDAY }),
        task({ id: 2, organizationId: 200, dueDate: TODAY }),
      ],
      NOW,
    );
    expect(intents).toEqual([
      {
        taskId: 1,
        organizationId: 100,
        recipientUserId: 7,
        kind: 'overdue',
      },
      {
        taskId: 2,
        organizationId: 200,
        recipientUserId: 7,
        kind: 'due',
      },
    ]);
  });

  it('honors local-time boundaries: a Task dueDate of today at 23:59 local still emits `due`, not `overdue`', () => {
    const lateNow = new Date(2026, 4, 20, 23, 59, 0);
    const intents = DeadlineSweep.computeDeadlineNotifications(
      [task({ id: 1, dueDate: TODAY })],
      lateNow,
    );
    expect(intents[0].kind).toBe('due');
  });
});
