import { PermissionCode } from '@workspace/shared/enums';

export function hasTaskReadAll(codes: string[]): boolean {
  return codes.includes(PermissionCode.TASK_READ_ALL);
}

export function hasTaskManageAll(codes: string[]): boolean {
  return codes.includes(PermissionCode.TASK_MANAGE_ALL);
}

export function canReadTask(
  assignedTo: number,
  actorUserId: number,
  codes: string[],
): boolean {
  return hasTaskReadAll(codes) || assignedTo === actorUserId;
}

export function canManageTask(
  assignedTo: number,
  actorUserId: number,
  codes: string[],
): boolean {
  return hasTaskManageAll(codes) || assignedTo === actorUserId;
}

export function canAssignTaskTo(
  assigneeId: number,
  actorUserId: number,
  codes: string[],
): boolean {
  return hasTaskManageAll(codes) || assigneeId === actorUserId;
}
