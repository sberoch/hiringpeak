"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  GitBranch,
  ListChecks,
  Pencil,
  Trash2,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  completeTask,
  getAllTasks,
  reopenTask,
  TASK_API_KEY,
} from "@/lib/api/tasks";
import {
  getUnreadNotificationCount,
  NOTIFICATION_API_KEY,
} from "@/lib/api/notifications";
import { Card } from "@workspace/ui/components/card";
import { PageHeading } from "@workspace/ui/components/page-heading";
import { cn } from "@workspace/ui/lib/utils";
import type { TaskWithRelations } from "@workspace/shared/types/task";

import { DeleteTaskDialog } from "./delete-task-dialog";
import { EditTaskDialog } from "./edit-task-dialog";
import { NewTaskForm } from "./new-task-form";
import { NotificationsList } from "./notifications-list";

type Chip = "mine" | "all" | "overdue" | "none" | "notif";

function formatDueDate(dueDate: string | null | undefined) {
  if (!dueDate) return "Sin fecha";
  const [y, m, d] = dueDate.split("-");
  return `${d}/${m}/${y}`;
}

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

type AttachChipData = { icon: LucideIcon; label: string };

function attachmentChip(task: TaskWithRelations): AttachChipData | null {
  if (task.candidateId != null) {
    return {
      icon: User,
      label: task.candidate?.name ?? `Postulante #${task.candidateId}`,
    };
  }
  if (task.vacancyId != null) {
    return {
      icon: GitBranch,
      label: task.vacancy?.title ?? `Vacante #${task.vacancyId}`,
    };
  }
  if (task.companyId != null) {
    return {
      icon: Building2,
      label: task.company?.name ?? `Empresa #${task.companyId}`,
    };
  }
  return null;
}

export function TasksPage() {
  const queryClient = useQueryClient();
  const session = useSession();
  const today = useMemo(() => todayIsoDay(), []);
  const currentUserId = session.data?.userId
    ? parseInt(session.data.userId, 10)
    : null;

  const { data, isLoading } = useQuery({
    queryKey: [TASK_API_KEY, { order: "createdAt:desc", limit: 100 }],
    queryFn: () => getAllTasks({ order: "createdAt:desc", limit: 100 }),
    staleTime: 0,
  });

  const tasks = data?.items ?? [];

  const { data: unread } = useQuery({
    queryKey: [NOTIFICATION_API_KEY, "unread-count"],
    queryFn: getUnreadNotificationCount,
    staleTime: 0,
  });
  const unreadCount = unread?.count ?? 0;

  const [chip, setChip] = useState<Chip>("mine");
  const [editing, setEditing] = useState<TaskWithRelations | null>(null);
  const [deleting, setDeleting] = useState<TaskWithRelations | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (chip === "mine") return t.assignedTo === currentUserId;
      if (chip === "overdue") return isOverdue(t, today);
      if (chip === "none") return !t.dueDate && !t.completed;
      return true;
    });
  }, [tasks, chip, currentUserId, today]);

  const completeMutation = useMutation({
    mutationFn: (id: number) => completeTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASK_API_KEY] });
    },
    onError: () => toast.error("No se pudo completar la tarea"),
  });

  const reopenMutation = useMutation({
    mutationFn: (id: number) => reopenTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASK_API_KEY] });
    },
    onError: () => toast.error("No se pudo reabrir la tarea"),
  });

  const toggleDone = (t: TaskWithRelations) => {
    if (t.completed) {
      reopenMutation.mutate(t.id);
    } else {
      completeMutation.mutate(t.id);
    }
  };

  return (
    <>
      <div className="mb-6">
        <PageHeading
          icon={ListChecks}
          title="Tareas"
          description="Captura y revisa el trabajo pendiente del equipo."
        />
      </div>

      <Card className="mb-6 rounded-2xl border border-brand-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <h2 className="text-lg font-bold tracking-tight text-ink">
          Nueva tarea
        </h2>
        <p className="text-sm text-slate-brand mt-0.5 mb-4 leading-relaxed">
          Agrega un pendiente con un responsable y un vencimiento opcional.
        </p>
        <NewTaskForm />
      </Card>

      <Card className="rounded-2xl border border-brand-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight text-ink">
            Listado
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { key: "mine", label: "Mis tareas" },
                { key: "all", label: "Todas" },
                { key: "overdue", label: "Vencidas" },
                { key: "none", label: "Sin fecha" },
                { key: "notif", label: "Notificaciones" },
              ] as { key: Chip; label: string }[]
            ).map(({ key, label }) => {
              const active = chip === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setChip(key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                    active
                      ? "bg-electric text-white shadow-[0_2px_8px_-2px_rgba(0,102,255,0.4)]"
                      : "bg-surface text-ink ring-1 ring-brand-border hover:ring-electric/30",
                  )}
                >
                  {label}
                  {key === "notif" && unreadCount > 0 ? (
                    <span
                      className={cn(
                        "rounded-full px-1.5 text-[11px] font-bold",
                        active
                          ? "bg-white/20 text-white"
                          : "bg-electric/10 text-electric",
                      )}
                    >
                      {unreadCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {chip === "notif" ? (
          <NotificationsList />
        ) : isLoading ? (
          <p className="text-sm text-slate-brand">Cargando tareas...</p>
        ) : filteredTasks.length === 0 ? (
          <p className="text-sm text-slate-brand">
            {chip === "mine"
              ? "No tenés tareas asignadas."
              : chip === "overdue"
                ? "No hay tareas vencidas."
                : chip === "none"
                  ? "No hay tareas sin fecha."
                  : "Todavía no hay tareas en esta organización."}
          </p>
        ) : (
          <ul className="divide-y divide-brand-border">
            {filteredTasks.map((task) => {
              const owner = task.assignedToUser?.name ?? "—";
              const overdue = isOverdue(task, today);
              return (
                <li
                  key={task.id}
                  className={cn(
                    "flex items-center gap-3 py-3",
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
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-brand">
                      <span>Responsable: {owner}</span>
                      {(() => {
                        const chip = attachmentChip(task);
                        if (!chip) return null;
                        const Icon = chip.icon;
                        return (
                          <span className="inline-flex max-w-[260px] items-center gap-1 rounded-md bg-electric/[0.06] px-1.5 py-0.5 text-[11px] font-medium text-electric">
                            <Icon className="h-3 w-3 shrink-0" />
                            <span className="truncate">{chip.label}</span>
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div
                    className={cn(
                      "ml-2 shrink-0 text-right text-xs font-semibold",
                      overdue ? "text-red-600" : "text-slate-brand",
                    )}
                  >
                    {overdue ? `Vencida · ${formatDueDate(task.dueDate)}` : formatDueDate(task.dueDate)}
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
      </Card>

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
