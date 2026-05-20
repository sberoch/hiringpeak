"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  GitBranch,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  completeTask,
  getAllTasks,
  reopenTask,
  TASK_API_KEY,
} from "@/lib/api/tasks";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { cn } from "@workspace/ui/lib/utils";
import type {
  TaskParams,
  TaskWithRelations,
} from "@workspace/shared/types/task";

import type { AttachmentValue } from "./attachment-picker";
import { DeleteTaskDialog } from "./delete-task-dialog";
import { EditTaskDialog } from "./edit-task-dialog";
import { NewTaskForm } from "./new-task-form";

export type TasksInContextContext =
  | { type: "candidate"; id: number; label: string }
  | { type: "vacancy"; id: number; label: string }
  | { type: "company"; id: number; label: string };

function todayIsoDay() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isOverdue(task: TaskWithRelations, today: string) {
  return !task.completed && !!task.dueDate && task.dueDate < today;
}

function formatDueDate(dueDate: string | null | undefined) {
  if (!dueDate) return "Sin fecha";
  const [y, m, d] = dueDate.split("-");
  return `${d}/${m}/${y}`;
}

function paramsFor(context: TasksInContextContext): TaskParams {
  const base: TaskParams = { order: "createdAt:desc", limit: 100 };
  if (context.type === "candidate") return { ...base, candidateId: context.id };
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
  const queryClient = useQueryClient();
  const today = useMemo(() => todayIsoDay(), []);
  const params = useMemo(() => paramsFor(context), [context]);

  const { data, isLoading } = useQuery({
    queryKey: [TASK_API_KEY, params],
    queryFn: () => getAllTasks(params),
    staleTime: 0,
  });

  const tasks = data?.items ?? [];
  const totalItems = data?.meta.totalItems ?? 0;
  const openCount = tasks.filter((t) => !t.completed).length;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<TaskWithRelations | null>(null);
  const [deleting, setDeleting] = useState<TaskWithRelations | null>(null);

  const completeMutation = useMutation({
    mutationFn: (id: number) => completeTask(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [TASK_API_KEY] }),
    onError: () => toast.error("No se pudo completar la tarea"),
  });

  const reopenMutation = useMutation({
    mutationFn: (id: number) => reopenTask(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [TASK_API_KEY] }),
    onError: () => toast.error("No se pudo reabrir la tarea"),
  });

  const toggleDone = (t: TaskWithRelations) => {
    if (t.completed) reopenMutation.mutate(t.id);
    else completeMutation.mutate(t.id);
  };

  const lockedAttachment: NonNullable<AttachmentValue> = {
    type: context.type,
    id: context.id,
    label: context.label,
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
            <Badge
              variant="secondary"
              className={cn(
                "rounded-lg font-semibold bg-electric/[0.08] text-electric hover:bg-electric/[0.08]",
                isCompact ? "text-[11px] px-1.5 py-0" : "text-xs",
              )}
            >
              {totalItems} {totalItems === 1 ? "tarea" : "tareas"}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="brand-ghost"
            className="bg-white"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Tarea
          </Button>
        </div>

        <Card
          className={cn(
            "rounded-2xl border border-brand-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
            isCompact ? "p-4" : "p-6",
          )}
        >
          {isLoading ? (
            <p className="text-sm text-slate-brand">Cargando tareas...</p>
          ) : tasks.length === 0 ? (
            <div
              className={cn(
                "flex flex-col items-center justify-center text-center",
                isCompact ? "py-4" : "py-8",
              )}
            >
              {!isCompact && (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric/10 text-electric mb-3">
                  <ContextIcon className="h-5 w-5" />
                </div>
              )}
              <p className="text-sm font-medium text-ink">
                Todavía no hay tareas aquí
              </p>
              <p className="text-xs text-slate-brand mt-1 max-w-xs">
                Captura el trabajo pendiente vinculado a esta{" "}
                {contextNoun(context)}.
              </p>
              <Button
                size="sm"
                className="mt-4 bg-electric hover:bg-electric-light text-white rounded-md px-4 font-semibold"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Nueva tarea
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-brand-border">
              {tasks.map((task) => {
                const owner = task.assignedToUser?.name ?? "—";
                const overdue = isOverdue(task, today);
                return (
                  <li
                    key={task.id}
                    className={cn(
                      "flex items-center gap-3 py-3 first:pt-0 last:pb-0",
                      task.completed && "opacity-60",
                    )}
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={task.completed}
                      onClick={() => toggleDone(task)}
                      disabled={
                        completeMutation.isPending || reopenMutation.isPending
                      }
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                        task.completed
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-brand-border hover:border-electric",
                      )}
                    >
                      {task.completed && (
                        <svg
                          viewBox="0 0 12 12"
                          className="h-3 w-3 text-white"
                        >
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
                    </button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate text-sm font-medium text-ink",
                          task.completed && "line-through",
                        )}
                      >
                        {task.title}
                      </p>
                      <div className="mt-0.5 text-xs text-slate-brand">
                        Responsable: {owner}
                      </div>
                    </div>

                    <div
                      className={cn(
                        "ml-2 shrink-0 text-right text-xs font-semibold",
                        overdue ? "text-red-600" : "text-slate-brand",
                      )}
                    >
                      {overdue
                        ? `Vencida · ${formatDueDate(task.dueDate)}`
                        : formatDueDate(task.dueDate)}
                    </div>

                    <div className="ml-2 flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(task)}
                        aria-label="Editar tarea"
                        className="rounded-md p-1.5 text-slate-brand hover:bg-canvas hover:text-ink"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(task)}
                        aria-label="Eliminar tarea"
                        className="rounded-md p-1.5 text-slate-brand hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {tasks.length > 0 && (
            <p className="text-xs text-slate-brand mt-4">
              {openCount} {openCount === 1 ? "abierta" : "abiertas"} ·{" "}
              {totalItems - openCount}{" "}
              {totalItems - openCount === 1 ? "completada" : "completadas"}
            </p>
          )}
        </Card>
      </div>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => !open && setIsCreateOpen(false)}
      >
        <DialogContent className="rounded-2xl border-brand-border bg-surface">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-ink">
              Nueva tarea
            </DialogTitle>
            <DialogDescription className="text-slate-brand">
              Vinculada a{" "}
              <span className="font-semibold text-ink">{context.label}</span>.
            </DialogDescription>
          </DialogHeader>
          <NewTaskForm
            lockedAttachment={lockedAttachment}
            onSubmit={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <EditTaskDialog
        task={editing}
        isOpen={!!editing}
        onClose={() => setEditing(null)}
      />
      <DeleteTaskDialog
        task={deleting}
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
