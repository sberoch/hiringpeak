/**
 * Follow-ups with a Contact: open Tasks attached to them (no stage, no status,
 * never "Sin próximo paso"). Pure: no I/O, no throw. Shared by the API and the
 * Web app.
 */

/** "Abordar en X días" presets. */
export const FOLLOW_UP_PRESET_DAYS = [3, 7, 14, 30] as const;

/**
 * Where a follow-up comes from: `capture` is the one scheduled with "Abordar
 * en X días" while capturing a new Contact; `added` is any other
 * ("Agregar seguimiento", the Contact page).
 */
export type FollowUpOrigin = "capture" | "added";

/**
 * The default Task Owner of a follow-up. A follow-up is owned by whoever
 * creates it, even on someone else's Contact, except the one scheduled on
 * capture, which goes to the Contact Owner (the creator when there is none).
 */
export function defaultFollowUpOwner(
  origin: FollowUpOrigin,
  people: { creatorId: number; contactOwnerId: number | null },
): number {
  if (origin === "capture") return people.contactOwnerId ?? people.creatorId;
  return people.creatorId;
}

/** The due day (`YYYY-MM-DD`) of a follow-up `days` after `today` (`YYYY-MM-DD`). */
export function followUpDueDate(today: string, days: number): string {
  const [y, m, d] = today.split("-").map(Number);
  const due = new Date(Date.UTC(y!, m! - 1, d! + days));
  return due.toISOString().slice(0, 10);
}

/** The default title of a follow-up with a Contact: "Abordar a <first name>". */
export function followUpTitle(contactName: string): string {
  const first = contactName.trim().split(/\s+/)[0] ?? "";
  return `Abordar a ${first}`.trim();
}

/**
 * The next follow-up among a Contact's open Tasks: due first, undated last,
 * ties to the oldest Task.
 */
export function nextFollowUp<T extends { id: number; dueDate: string | null }>(
  openTasks: readonly T[],
): T | null {
  let next: T | null = null;
  for (const task of openTasks) {
    if (!next || compareFollowUps(task, next) < 0) next = task;
  }
  return next;
}

function compareFollowUps(
  a: { id: number; dueDate: string | null },
  b: { id: number; dueDate: string | null },
): number {
  if (a.dueDate !== b.dueDate) {
    if (a.dueDate == null) return 1;
    if (b.dueDate == null) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  return a.id - b.id;
}
