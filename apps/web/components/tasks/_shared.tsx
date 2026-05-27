"use client";

import {
  AlertTriangle,
  Building2,
  Clock,
  GitBranch,
  Slash,
  User,
  UserPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@workspace/ui/lib/utils";
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

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

const ATTACH_ICON: Record<"candidate" | "vacancy" | "company", LucideIcon> = {
  candidate: User,
  vacancy: GitBranch,
  company: Building2,
};

const ATTACH_LABEL: Record<"candidate" | "vacancy" | "company", string> = {
  candidate: "Postulante",
  vacancy: "Vacante",
  company: "Empresa",
};

export type TaskAttachment = {
  type: "candidate" | "vacancy" | "company";
  label: string;
} | null;

export function taskAttachment(task: TaskWithRelations): TaskAttachment {
  if (task.candidateId != null) {
    return {
      type: "candidate",
      label: task.candidate?.name ?? `Postulante #${task.candidateId}`,
    };
  }
  if (task.vacancyId != null) {
    return {
      type: "vacancy",
      label: task.vacancy?.title ?? `Vacante #${task.vacancyId}`,
    };
  }
  if (task.companyId != null) {
    return {
      type: "company",
      label: task.company?.name ?? `Empresa #${task.companyId}`,
    };
  }
  return null;
}

export function AttachChip({
  attach,
  className,
}: {
  attach: TaskAttachment;
  className?: string;
}) {
  if (!attach) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-dashed border-brand-border px-1.5 py-0.5 text-[11px] text-muted-brand",
          className,
        )}
      >
        <Slash className="h-3 w-3" />
        Sin vincular
      </span>
    );
  }
  const Icon = ATTACH_ICON[attach.type];
  return (
    <span
      title={`${ATTACH_LABEL[attach.type]}: ${attach.label}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-electric/5 px-1.5 py-0.5 text-[11px] font-medium text-electric",
        className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span className="truncate max-w-[180px]">{attach.label}</span>
    </span>
  );
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
  const attach = taskAttachment(task);
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
            "truncate text-sm font-medium text-ink",
            task.completed && "line-through",
          )}
        >
          {task.title}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <AttachChip attach={attach} />
        </div>
      </div>

      <span
        className={cn(
          "shrink-0 text-xs font-semibold",
          dueTone(task, today),
        )}
      >
        {formatDue(task, today)}
      </span>
      {!hideOwner && (
        <OwnerAvatar name={ownerName} isMe={isMe} size="sm" />
      )}
    </button>
  );
}

export function DueSummaryStrip({
  overdue,
  today,
  week,
  className,
}: {
  overdue: number;
  today: number;
  week: number;
  className?: string;
}) {
  const items = [
    { label: "Vencidas", value: overdue, tone: "text-red-600" },
    { label: "Vence hoy", value: today, tone: "text-amber-600" },
    { label: "Esta semana", value: week, tone: "text-ink" },
  ];
  return (
    <div
      className={cn(
        "flex items-center divide-x divide-brand-border rounded-xl border border-brand-border bg-surface",
        className,
      )}
    >
      {items.map((it) => (
        <div
          key={it.label}
          className="flex flex-1 flex-col items-center px-4 py-3"
        >
          <span className={cn("text-xl font-bold tracking-tight", it.tone)}>
            {it.value}
          </span>
          <span className="text-[11px] text-slate-brand">{it.label}</span>
        </div>
      ))}
    </div>
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
