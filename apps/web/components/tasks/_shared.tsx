"use client";

import { AlertTriangle, Clock, Lock, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@workspace/ui/lib/utils";
import type { TaskWithRelations } from "@workspace/shared/types/task";

import {
  AttachChips,
  isCommercialTaskRecord,
  taskAttachments,
} from "./attachments";

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

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function OwnerAvatar({
  name,
  isMe,
  size = "md",
}: {
  name: string;
  isMe?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <span
      title={`Responsable: ${name}${isMe ? " (vos)" : ""}`}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-electric/10 font-semibold text-electric",
        size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs",
        isMe && "ring-2 ring-electric/30",
      )}
    >
      {initials(name)}
    </span>
  );
}

interface TaskRowProps {
  task: TaskWithRelations;
  today: string;
  currentUserId: number | null;
  onOpen: (task: TaskWithRelations) => void;
  onToggleDone: (task: TaskWithRelations) => void;
  busy?: boolean;
  /** Hide the right-side OwnerAvatar (e.g. context card where all rows share owner). */
  hideOwner?: boolean;
  /** Set when this row is not the first in its container (adds top divider). */
  bordered?: boolean;
}

export function TaskRow({
  task,
  today,
  currentUserId,
  onOpen,
  onToggleDone,
  busy,
  hideOwner,
  bordered,
}: TaskRowProps) {
  const attachments = taskAttachments(task);
  const ownerName = task.assignedToUser?.name ?? "—";
  const isMe =
    currentUserId != null && task.assignedToUser?.id === currentUserId;
  return (
    <button
      type="button"
      onClick={() => onOpen(task)}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-canvas",
        bordered && "border-t border-brand-border",
        task.completed && "opacity-55",
      )}
    >
      <span
        role="checkbox"
        aria-checked={task.completed}
        onClick={(ev) => {
          ev.stopPropagation();
          if (!busy) onToggleDone(task);
        }}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
          task.completed
            ? "border-emerald-500 bg-emerald-500"
            : "border-brand-border hover:border-electric",
        )}
      >
        {task.completed && (
          <svg viewBox="0 0 12 12" className="h-3 w-3 text-white">
            <path
              d="M2 6l3 3 5-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "flex min-w-0 items-center gap-1.5 text-sm font-medium text-ink",
            task.completed && "line-through",
          )}
        >
          {isCommercialTaskRecord(task) && (
            <Lock
              className="h-3 w-3 shrink-0 text-violet-500"
              aria-label="Comercial"
            />
          )}
          <span className="truncate">{task.title}</span>
        </p>
        <div className="mt-1 flex items-center gap-2">
          <AttachChips attachments={attachments} />
        </div>
      </div>

      <span
        className={cn("shrink-0 text-xs font-semibold", dueTone(task, today))}
      >
        {formatDue(task, today)}
      </span>
      {!hideOwner && <OwnerAvatar name={ownerName} isMe={isMe} size="sm" />}
    </button>
  );
}

export type NotificationKind = "assigned" | "due" | "overdue";

export const NOTIF_LABEL: Record<NotificationKind, string> = {
  assigned: "Te asignaron una tarea",
  due: "Una tarea vence hoy",
  overdue: "Una tarea está vencida",
};

export const NOTIF_ICON: Record<
  NotificationKind,
  { icon: LucideIcon; tone: string; bg: string }
> = {
  assigned: { icon: UserPlus, tone: "text-electric", bg: "bg-electric/10" },
  due: { icon: Clock, tone: "text-amber-600", bg: "bg-amber-50" },
  overdue: { icon: AlertTriangle, tone: "text-red-600", bg: "bg-red-50" },
};
