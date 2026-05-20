"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, GitBranch, ListChecks, Plus, User } from "lucide-react";
import { useMemo, useState } from "react";

import { getAllTasks, TASK_API_KEY } from "@/lib/api/tasks";
import { cn } from "@workspace/ui/lib/utils";
import type {
  TaskParams,
  TaskWithRelations,
} from "@workspace/shared/types/task";

import type { AttachmentValue } from "./attachment-picker";
import { dueTone, formatDue, todayIsoDay } from "./_shared";
import { TaskSheet } from "./task-sheet";

export type TasksInContextContext =
  | { type: "candidate"; id: number; label: string }
  | { type: "vacancy"; id: number; label: string }
  | { type: "company"; id: number; label: string };

function paramsFor(context: TasksInContextContext): TaskParams {
  const base: TaskParams = { order: "createdAt:desc", limit: 100 };
  if (context.type === "candidate")
    return { ...base, candidateId: context.id };
  if (context.type === "vacancy") return { ...base, vacancyId: context.id };
  return { ...base, companyId: context.id };
}

function contextIcon(context: TasksInContextContext) {
  if (context.type === "candidate") return User;
  if (context.type === "company") return Building2;
  return GitBranch;
}

function contextNoun(context: TasksInContextContext) {
  if (context.type === "candidate") return "persona";
  if (context.type === "vacancy") return "vacante";
  return "empresa";
}

interface TasksInContextCardProps {
  context: TasksInContextContext;
  className?: string;
  variant?: "default" | "compact";
}

export function TasksInContextCard({
  context,
  className,
  variant = "default",
}: TasksInContextCardProps) {
  const isCompact = variant === "compact";
  const today = useMemo(() => todayIsoDay(), []);
  const params = useMemo(() => paramsFor(context), [context]);

  const { data, isLoading } = useQuery({
    queryKey: [TASK_API_KEY, params],
    queryFn: () => getAllTasks(params),
    staleTime: 0,
  });

  const tasks = data?.items ?? [];
  const openTasks = tasks.filter((t) => !t.completed);
  const totalItems = data?.meta.totalItems ?? 0;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<TaskWithRelations | null>(null);

  const lockedAttachment: NonNullable<AttachmentValue> = {
    type: context.type,
    id: context.id,
    label: context.label,
  };

  const openNew = () => {
    setEditing(null);
    setSheetOpen(true);
  };
  const openEdit = (t: TaskWithRelations) => {
    setEditing(t);
    setSheetOpen(true);
  };

  const HeadingIcon = ListChecks;
  const ContextIcon = contextIcon(context);

  return (
    <>
      <div className={cn("flex flex-col min-w-0", className)}>
        <div
          className={cn(
            "flex items-center justify-between gap-3",
            isCompact ? "mb-2" : "mb-4",
          )}
        >
          <div className="flex items-center gap-2">
            {isCompact ? (
              <HeadingIcon className="h-4 w-4 text-slate-brand" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric/10 text-electric">
                <HeadingIcon className="h-4 w-4" />
              </div>
            )}
            <h2
              className={cn(
                "font-bold tracking-tight text-ink",
                isCompact ? "text-sm" : "text-lg",
              )}
            >
              Tareas
            </h2>
            {totalItems > 0 && (
              <span className="rounded-md bg-electric/[0.08] px-1.5 py-0.5 text-[11px] font-semibold text-electric">
                {totalItems}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-electric/40 hover:bg-electric/5"
          >
            <Plus className="h-3.5 w-3.5" />
            Tarea
          </button>
        </div>

        <div className="rounded-2xl border border-brand-border bg-surface px-4 py-3">
          {isLoading ? (
            <p className="py-2 text-center text-sm text-muted-brand">
              Cargando tareas…
            </p>
          ) : openTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-2 py-6 text-center">
              {!isCompact && (
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-electric/10 text-electric">
                  <ContextIcon className="h-5 w-5" />
                </div>
              )}
              <p className="text-sm font-medium text-ink">
                Sin tareas abiertas.
              </p>
              <p className="mt-1 max-w-xs text-xs text-slate-brand">
                Captura el trabajo pendiente vinculado a esta{" "}
                {contextNoun(context)}.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-brand-border">
              {openTasks.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => openEdit(task)}
                    className="flex w-full items-center justify-between gap-2 py-2 text-left text-sm transition-colors hover:bg-canvas/60"
                  >
                    <span className="truncate text-ink">{task.title}</span>
                    <span
                      className={cn(
                        "shrink-0 text-xs font-semibold",
                        dueTone(task, today),
                      )}
                    >
                      {formatDue(task, today)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <TaskSheet
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o);
          if (!o) setEditing(null);
        }}
        task={editing}
        lockedAttachment={editing ? undefined : lockedAttachment}
      />
    </>
  );
}
