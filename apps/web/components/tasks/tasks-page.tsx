"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListTodo, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { usePermissions } from "@/contexts/permission-context";
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
import { PermissionCode } from "@workspace/shared/enums";
import { Button } from "@workspace/ui/components/button";
import { PageHeading } from "@workspace/ui/components/page-heading";
import { cn } from "@workspace/ui/lib/utils";
import type { TaskWithRelations } from "@workspace/shared/types/task";

import { NotificationsList } from "./notifications-list";
import {
  DueSummaryStrip,
  TaskRow,
  dueBucket,
  isOverdue,
  todayIsoDay,
} from "./_shared";
import { TaskSheet } from "./task-sheet";

type ScopeChip = "all" | "mine";
type FilterChip = "overdue" | "none" | "notif";
type Chip = ScopeChip | FilterChip;

const SECONDARY_CHIPS: { key: FilterChip; label: string }[] = [
  { key: "overdue", label: "Vencidas" },
  { key: "none", label: "Sin fecha" },
  { key: "notif", label: "Notificaciones" },
];

export function TasksPage() {
  const queryClient = useQueryClient();
  const session = useSession();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const canReadAll = hasPermission(PermissionCode.TASK_READ_ALL);
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<TaskWithRelations | null>(null);

  useEffect(() => {
    if (permissionsLoading) return;
    setChip(canReadAll ? "all" : "mine");
  }, [canReadAll, permissionsLoading]);

  const counts = useMemo(() => {
    const open = tasks.filter((t) => !t.completed);
    return {
      overdue: open.filter((t) => dueBucket(t, today) === "overdue").length,
      today: open.filter((t) => dueBucket(t, today) === "today").length,
      week: open.filter((t) => dueBucket(t, today) === "week").length,
    };
  }, [tasks, today]);

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => {
        if (canReadAll && chip === "mine") {
          return t.assignedTo === currentUserId;
        }
        if (chip === "overdue") return isOverdue(t, today);
        if (chip === "none") return !t.dueDate && !t.completed;
        return true;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const ad = a.dueDate ?? "9999";
        const bd = b.dueDate ?? "9999";
        return ad.localeCompare(bd);
      });
  }, [tasks, chip, canReadAll, currentUserId, today]);

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
  const busy = completeMutation.isPending || reopenMutation.isPending;
  const toggleDone = (t: TaskWithRelations) => {
    if (t.completed) reopenMutation.mutate(t.id);
    else completeMutation.mutate(t.id);
  };

  const openNew = () => {
    setEditing(null);
    setSheetOpen(true);
  };
  const openEdit = (t: TaskWithRelations) => {
    setEditing(t);
    setSheetOpen(true);
  };

  const defaultChip: Chip = canReadAll ? "all" : "mine";
  const handleChipClick = (key: Chip) => {
    setChip((current) => (current === key ? defaultChip : key));
  };

  const chips: { key: Chip; label: string; badge?: number }[] = canReadAll
    ? [
        { key: "all", label: "Todas" },
        { key: "mine", label: "Mis tareas" },
        ...SECONDARY_CHIPS.map((c) => ({
          ...c,
          badge:
            c.key === "overdue"
              ? counts.overdue
              : c.key === "notif"
                ? unreadCount
                : undefined,
        })),
      ]
    : SECONDARY_CHIPS.map((c) => ({
        ...c,
        badge:
          c.key === "overdue"
            ? counts.overdue
            : c.key === "notif"
              ? unreadCount
              : undefined,
      }));

  const emptyMessage =
    chip === "overdue"
      ? "No hay tareas vencidas."
      : chip === "none"
        ? "No hay tareas sin fecha."
        : canReadAll && chip === "mine"
          ? "No tenés tareas asignadas."
          : canReadAll
            ? "Todavía no hay tareas en esta organización."
            : "No tenés tareas asignadas.";

  return (
    <div className="mx-auto flex max-w-[1000px] w-full flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeading
          icon={ListTodo}
          title="Tareas"
          description={
            canReadAll
              ? "Tu bandeja de pendientes y avisos, todo en un solo lugar."
              : "Tu backlog de pendientes y avisos."
          }
        />
        <Button
          type="button"
          onClick={openNew}
          className="bg-electric hover:bg-electric-light text-white rounded-md px-5 py-2 font-semibold shadow-none hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.3)] transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Nueva tarea
        </Button>
      </div>

      <DueSummaryStrip
        overdue={counts.overdue}
        today={counts.today}
        week={counts.week}
      />

      <div className="flex flex-wrap items-center gap-2">
        {chips.map((c) => {
          const isActive = chip === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => handleChipClick(c.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-electric text-white shadow-[0_2px_8px_-2px_rgba(0,102,255,0.4)]"
                  : "bg-surface text-ink ring-1 ring-brand-border hover:ring-electric/30",
              )}
            >
              {c.label}
              {c.badge ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[11px] font-bold",
                    isActive
                      ? "bg-white/20 text-white"
                      : c.key === "overdue"
                        ? "bg-red-100 text-red-700"
                        : "bg-electric/10 text-electric",
                  )}
                >
                  {c.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {chip === "notif" ? (
        <NotificationsList />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-brand-border bg-surface">
          {isLoading ? (
            <p className="px-6 py-16 text-center text-sm text-muted-brand">
              Cargando tareas…
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-muted-brand">
              {emptyMessage}
            </p>
          ) : (
            filtered.map((task, i) => (
              <TaskRow
                key={task.id}
                task={task}
                today={today}
                currentUserId={currentUserId}
                onOpen={openEdit}
                onToggleDone={toggleDone}
                busy={busy}
                bordered={i !== 0}
              />
            ))
          )}
        </div>
      )}

      <TaskSheet
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o);
          if (!o) setEditing(null);
        }}
        task={editing}
      />
    </div>
  );
}
