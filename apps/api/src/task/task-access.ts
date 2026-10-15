import { PermissionCode } from '@workspace/shared/enums';
import { hasCommercialAccess } from '@workspace/shared/lib/commercial-access';

export { isCommercialTask } from '@workspace/shared/lib/task-visibility';

/**
 * Who can read, manage and own a Task. Pure: no I/O, no throw.
 *
 * Two layers (ADR 0005): a commercial Task (see `isCommercialTask`) is only
 * for Users with commercial access (`CRM_READ` is enough); within that, and
 * for every other Task, the `TASK_*` / `TASK_*_ALL` rules apply unchanged.
 */

/** The facts about a Task the access rules look at. */
export type TaskAccessFacts = {
  /** Task Owner. */
  assignedTo: number;
  commercial: boolean;
};

export function hasTaskReadAll(codes: string[]): boolean {
  return codes.includes(PermissionCode.TASK_READ_ALL);
}

export function hasTaskManageAll(codes: string[]): boolean {
  return codes.includes(PermissionCode.TASK_MANAGE_ALL);
}

/** Commercial Tasks are invisible without commercial access. */
function passesCommercialGate(
  task: Pick<TaskAccessFacts, 'commercial'>,
  codes: string[],
): boolean {
  return !task.commercial || hasCommercialAccess(codes);
}

export function canReadTask(
  task: TaskAccessFacts,
  actorUserId: number,
  codes: string[],
): boolean {
  return (
    passesCommercialGate(task, codes) &&
    (hasTaskReadAll(codes) || task.assignedTo === actorUserId)
  );
}

/**
 * Violation (Spanish, user-facing) when the actor writes a Task — creates it,
 * or edits it into this shape — that they may not, or null. `task` is the
 * Task as it will be after the write.
 */
export function taskWriteViolation(
  task: TaskAccessFacts & { ownerHasCommercialAccess: boolean },
  actorUserId: number,
  codes: string[],
): string | null {
  if (!passesCommercialGate(task, codes)) {
    return 'Sin acceso comercial no se pueden crear ni editar tareas comerciales.';
  }
  if (!hasTaskManageAll(codes) && task.assignedTo !== actorUserId) {
    return 'No podés asignar tareas a otros usuarios.';
  }
  if (task.commercial && !task.ownerHasCommercialAccess) {
    return 'El responsable de una tarea comercial tiene que tener acceso comercial.';
  }
  return null;
}

export function canManageTask(
  task: TaskAccessFacts,
  actorUserId: number,
  codes: string[],
): boolean {
  return (
    passesCommercialGate(task, codes) &&
    (hasTaskManageAll(codes) || task.assignedTo === actorUserId)
  );
}
