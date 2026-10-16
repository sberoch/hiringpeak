import type { TaskWithRelations } from "@workspace/shared/types/task";

const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export function todayIsoDay(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseDay(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

function daysBetween(from: string, to: string): number {
  const a = parseDay(from).getTime();
  const b = parseDay(to).getTime();
  return Math.round((b - a) / 86400000);
}

export function isOverdue(
  task: Pick<TaskWithRelations, "dueDate" | "completed">,
  today: string,
): boolean {
  return !task.completed && !!task.dueDate && task.dueDate < today;
}

export type DueBucket = "overdue" | "today" | "week" | "later" | "none";

export function dueBucket(
  task: Pick<TaskWithRelations, "dueDate" | "completed">,
  today: string,
): DueBucket {
  if (!task.dueDate) return "none";
  if (isOverdue(task, today)) return "overdue";
  const days = daysBetween(today, task.dueDate);
  if (days <= 0) return "today";
  if (days <= 7) return "week";
  return "later";
}

/** Human Spanish due label per Variant A. */
export function formatDue(
  task: Pick<TaskWithRelations, "dueDate" | "completed">,
  today: string,
): string {
  if (!task.dueDate) return "Sin fecha";
  const days = daysBetween(today, task.dueDate);
  if (isOverdue(task, today)) {
    const overdueBy = -days;
    return overdueBy === 1 ? "Venció ayer" : `Vencida hace ${overdueBy} días`;
  }
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence mañana";
  const d = parseDay(task.dueDate);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function dueTone(
  task: Pick<TaskWithRelations, "dueDate" | "completed">,
  today: string,
): string {
  if (isOverdue(task, today)) return "text-red-600";
  if (task.dueDate && dueBucket(task, today) === "today")
    return "text-amber-600";
  return "text-slate-brand";
}

export function relativeTime(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  const diffMin = Math.max(0, Math.floor((Date.now() - dt.getTime()) / 60000));
  if (diffMin < 1) return "hace un momento";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.round(h / 24);
  return days === 1 ? "ayer" : `hace ${days} días`;
}
