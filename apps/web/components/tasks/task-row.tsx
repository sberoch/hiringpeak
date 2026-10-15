"use client";

import { Lock } from "lucide-react";

import { cn } from "@workspace/ui/lib/utils";
import type { TaskWithRelations } from "@workspace/shared/types/task";

import {
  AttachChips,
  isCommercialTaskRecord,
  taskAttachments,
} from "./attachments";
import { dueTone, formatDue } from "@/components/tasks/task-due-dates";

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
