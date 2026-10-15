import { isOpenStage } from '@workspace/shared/lib/opportunity-stage';

/**
 * An Opportunity's next step and No Next Step ("Sin próximo paso"). Both are
 * derived from the open Tasks attached to it and never stored. Pure: no I/O,
 * no throw.
 */

/** An open Task attached to the Opportunity; `dueDate` is `YYYY-MM-DD` or null. */
export type NextStepCandidate = { id: number; dueDate: string | null };

/** The earliest open Task by due date, undated last; null when there is none. */
export function nextStepOf<T extends NextStepCandidate>(
  openTasks: readonly T[],
): T | null {
  let next: T | null = null;
  for (const task of openTasks) {
    if (!next || comesBefore(task, next)) next = task;
  }
  return next;
}

/** Earlier due date first, undated last; ties go to the Task created first. */
function comesBefore(a: NextStepCandidate, b: NextStepCandidate): boolean {
  if (a.dueDate !== b.dueDate) {
    if (a.dueDate == null) return false;
    if (b.dueDate == null) return true;
    return a.dueDate < b.dueDate;
  }
  return a.id < b.id;
}

/**
 * No Next Step: an open Opportunity (neither won nor lost) with no open Task
 * attached.
 */
export function hasNoNextStep(
  stage: { isWon: boolean; isLost: boolean },
  nextStep: NextStepCandidate | null,
): boolean {
  return isOpenStage(stage) && nextStep == null;
}
