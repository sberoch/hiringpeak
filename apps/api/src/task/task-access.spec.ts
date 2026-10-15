import { describe, expect, it } from 'vitest';
import {
  canManageTask,
  canReadTask,
  isCommercialTask,
  taskWriteViolation,
} from './task-access';

const RECRUITER_READ_ALL = ['TASK_READ', 'TASK_READ_ALL'];
const CRM_READER = ['TASK_READ', 'TASK_MANAGE', 'CRM_READ'];

describe('isCommercialTask', () => {
  it('a Task with an Opportunity attached is commercial', () => {
    expect(isCommercialTask({ opportunityIds: [3], vacancyIds: [1] })).toBe(
      true,
    );
  });

  it('a Task with a Contact attached is commercial', () => {
    expect(isCommercialTask({ contactIds: [5], companyIds: [2] })).toBe(true);
  });

  it('a Task attached only to recruiting records is not commercial', () => {
    expect(
      isCommercialTask({
        opportunityIds: [],
        contactIds: [],
        vacancyIds: [1],
        candidateIds: [2],
      }),
    ).toBe(false);
  });

  it('the stayed-commercial mark keeps a Task commercial with nothing commercial attached', () => {
    expect(
      isCommercialTask({
        opportunityIds: [],
        contactIds: [],
        stayedCommercial: true,
      }),
    ).toBe(true);
  });
});

describe('canReadTask', () => {
  it('a User with TASK_READ_ALL reads a colleague’s recruiting Task', () => {
    expect(
      canReadTask({ assignedTo: 9, commercial: false }, 1, RECRUITER_READ_ALL),
    ).toBe(true);
  });

  it('a User with TASK_READ_ALL but no commercial access can’t read a commercial Task', () => {
    expect(
      canReadTask({ assignedTo: 9, commercial: true }, 1, RECRUITER_READ_ALL),
    ).toBe(false);
  });

  it('a User without commercial access can’t read a commercial Task they own', () => {
    expect(
      canReadTask({ assignedTo: 1, commercial: true }, 1, ['TASK_READ']),
    ).toBe(false);
  });

  it('a CRM_READ User reads their own commercial Task', () => {
    expect(
      canReadTask({ assignedTo: 1, commercial: true }, 1, CRM_READER),
    ).toBe(true);
  });

  it('commercial access doesn’t widen Task permissions: no TASK_READ_ALL, no colleague’s Task', () => {
    expect(
      canReadTask({ assignedTo: 9, commercial: true }, 1, CRM_READER),
    ).toBe(false);
  });
});

describe('canManageTask', () => {
  it('a User with TASK_MANAGE_ALL but no commercial access can’t manage a commercial Task', () => {
    expect(
      canManageTask({ assignedTo: 9, commercial: true }, 1, [
        'TASK_MANAGE',
        'TASK_MANAGE_ALL',
      ]),
    ).toBe(false);
  });

  it('a CRM_READ User manages their own commercial Task', () => {
    expect(
      canManageTask({ assignedTo: 1, commercial: true }, 1, CRM_READER),
    ).toBe(true);
  });
});

describe('taskWriteViolation', () => {
  const MANAGER_ALL_CRM = ['TASK_MANAGE', 'TASK_MANAGE_ALL', 'CRM_MANAGE'];
  const RECRUITER_MANAGE_ALL = ['TASK_MANAGE', 'TASK_MANAGE_ALL'];

  it('a CRM_READ-only User can create a commercial Task for themselves', () => {
    expect(
      taskWriteViolation(
        { assignedTo: 1, commercial: true, ownerHasCommercialAccess: true },
        1,
        CRM_READER,
      ),
    ).toBeNull();
  });

  it('a CRM_READ-only User can’t create a commercial Task for a colleague without TASK_MANAGE_ALL', () => {
    expect(
      taskWriteViolation(
        { assignedTo: 9, commercial: true, ownerHasCommercialAccess: true },
        1,
        CRM_READER,
      ),
    ).not.toBeNull();
  });

  it('nobody can assign a commercial Task to a User without commercial access', () => {
    expect(
      taskWriteViolation(
        { assignedTo: 9, commercial: true, ownerHasCommercialAccess: false },
        1,
        MANAGER_ALL_CRM,
      ),
    ).not.toBeNull();
  });

  it('a User without commercial access can’t create a commercial Task', () => {
    expect(
      taskWriteViolation(
        { assignedTo: 9, commercial: true, ownerHasCommercialAccess: true },
        1,
        RECRUITER_MANAGE_ALL,
      ),
    ).not.toBeNull();
  });

  it('a recruiting Task can go to a User without commercial access', () => {
    expect(
      taskWriteViolation(
        { assignedTo: 9, commercial: false, ownerHasCommercialAccess: false },
        1,
        RECRUITER_MANAGE_ALL,
      ),
    ).toBeNull();
  });

  it('without TASK_MANAGE_ALL a recruiting Task stays with its creator', () => {
    expect(
      taskWriteViolation(
        { assignedTo: 9, commercial: false, ownerHasCommercialAccess: false },
        1,
        ['TASK_MANAGE'],
      ),
    ).not.toBeNull();
  });
});
