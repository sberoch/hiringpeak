"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  completeTask,
  getMyDueSoonTasks,
  reopenTask,
  TASK_API_KEY,
} from "@/lib/api/tasks";
import type { TaskWithRelations } from "@workspace/shared/types/task";

import { TaskRow, todayIsoDay } from "../tasks/_shared";
import { TaskSheet } from "../tasks/task-sheet";

export function DueSoonWidget() {
  const queryClient = useQueryClient();
  const session = useSession();
  const today = useMemo(() => todayIsoDay(), []);
  const currentUserId = session.data?.userId
    ? parseInt(session.data.userId, 10)
    : null;

  const { data, isLoading } = useQuery({
    queryKey: [TASK_API_KEY, "due-soon"],
    queryFn: getMyDueSoonTasks,
    staleTime: 0,
  });
  const tasks = data ?? [];

  const [editing, setEditing] = useState<TaskWithRelations | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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
  const busy = completeMutation.isPending || reopenMutation.isPending;
  const toggleDone = (t: TaskWithRelations) => {
    if (t.completed) reopenMutation.mutate(t.id);
    else completeMutation.mutate(t.id);
  };
  const openEdit = (t: TaskWithRelations) => {
    setEditing(t);
    setSheetOpen(true);
  };

  return (
    <div className="rounded-2xl border border-brand-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric/10 text-electric">
            <CalendarClock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-ink">
              Mis tareas próximas y vencidas
            </h3>
            <p className="text-xs text-slate-brand">
              Tus pendientes con fecha en los próximos 7 días.
            </p>
          </div>
        </div>
        <Link
          href="/tasks"
          className="text-xs font-semibold text-electric hover:underline"
        >
          Ver todas
        </Link>
      </div>

      {isLoading ? (
        <p className="px-6 py-10 text-center text-sm text-muted-brand">
          Cargando…
        </p>
      ) : tasks.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-muted-brand">
          No tenés tareas próximas. ¡Buen trabajo!
        </p>
      ) : (
        tasks.map((task, i) => (
          <TaskRow
            key={task.id}
            task={task}
            today={today}
            currentUserId={currentUserId}
            onOpen={openEdit}
            onToggleDone={toggleDone}
            busy={busy}
            bordered={i !== 0}
            hideOwner
          />
        ))
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
