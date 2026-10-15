"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, ListTodo, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
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
import { hasCommercialAccess } from "@workspace/shared/lib/commercial-access";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Label } from "@workspace/ui/components/label";
import { PageHeading } from "@workspace/ui/components/page-heading";
import { cn } from "@workspace/ui/lib/utils";
import type {
  TaskParams,
  TaskWithRelations,
} from "@workspace/shared/types/task";

import { NotificationsList } from "./notifications-list";
import { TaskRow, dueBucket, todayIsoDay, type DueBucket } from "./_shared";
import { TaskSheet } from "./task-sheet";

/**
 * «Vacantes» = Tasks with a Vacancy, Candidate or Candidacy attached;
 * «Comerciales» = commercial Tasks. Both only for commercial-side Users.
 */
type Pill = "vacancies" | "commercial" | "none" | "notif";

const SECTIONS: { key: DueBucket; label: string; dot: string; text: string }[] =
  [
    {
      key: "overdue",
      label: "Vencidas",
      dot: "bg-red-500",
      text: "text-red-600",
    },
    { key: "today", label: "Hoy", dot: "bg-amber-500", text: "text-amber-600" },
    { key: "week", label: "Esta semana", dot: "bg-electric", text: "text-ink" },
    {
      key: "later",
      label: "Más adelante",
      dot: "bg-slate-400",
      text: "text-ink",
    },
    {
      key: "none",
      label: "Sin fecha",
      dot: "bg-brand-border",
      text: "text-slate-brand",
    },
  ];

const TASKS_LIMIT = 500;

function byDueDate(a: TaskWithRelations, b: TaskWithRelations) {
  return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
}

function pillClass(active: boolean) {
  return cn(
    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
    active
      ? "bg-electric text-white shadow-[0_2px_8px_-2px_rgba(0,102,255,0.4)]"
      : "bg-surface text-ink ring-1 ring-brand-border hover:ring-electric/30",
  );
}

export function TasksPage() {
  const queryClient = useQueryClient();
  const session = useSession();
  const { hasPermission, permissionCodes } = usePermissions();
  const canReadAll = hasPermission(PermissionCode.TASK_READ_ALL);
  const isCommercialUser = hasCommercialAccess(permissionCodes);
  const today = useMemo(() => todayIsoDay(), []);
  const currentUserId = session.data?.userId
    ? parseInt(session.data.userId, 10)
    : null;

  const [pill, setPill] = useState<Pill | null>(null);
  const [onlyMine, setOnlyMine] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<TaskWithRelations | null>(null);

  const attachmentClass =
    isCommercialUser && (pill === "vacancies" || pill === "commercial")
      ? pill
      : undefined;
  const params: TaskParams = {
    order: "createdAt:desc",
    limit: TASKS_LIMIT,
    attachmentClass,
    assignedTo: onlyMine && currentUserId ? currentUserId : undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: [TASK_API_KEY, params],
    queryFn: () => getAllTasks(params),
    staleTime: 0,
  });

  const { data: unread } = useQuery({
    queryKey: [NOTIFICATION_API_KEY, "unread-count"],
    queryFn: getUnreadNotificationCount,
    staleTime: 0,
  });
  const unreadCount = unread?.count ?? 0;

  const { open, done } = useMemo(() => {
    const scoped = (data?.items ?? []).filter(
      (t) => pill !== "none" || (!t.dueDate && !t.completed),
    );
    return {
      open: scoped.filter((t) => !t.completed).sort(byDueDate),
      done: scoped.filter((t) => t.completed).sort(byDueDate),
    };
  }, [data, pill]);

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

  const noFilters = pill === null && !onlyMine;
  const clearFilters = () => {
    setPill(null);
    setOnlyMine(false);
  };

  const pills: { key: Pill; label: string; badge?: number }[] = [
    ...(isCommercialUser
      ? [
          { key: "vacancies" as const, label: "Vacantes" },
          { key: "commercial" as const, label: "Comerciales" },
        ]
      : []),
    { key: "none", label: "Sin fecha" },
    { key: "notif", label: "Notificaciones", badge: unreadCount },
  ];

  const renderRows = (rows: TaskWithRelations[]) => (
    <div className="overflow-hidden rounded-2xl border border-brand-border bg-surface">
      {rows.map((task, i) => (
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
      ))}
    </div>
  );

  return (
    <div className="mx-auto flex max-w-[1000px] w-full flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          icon={ListTodo}
          title="Tareas"
          description={
            isLoading
              ? "Tu bandeja de pendientes y avisos."
              : `${open.length} ${open.length === 1 ? "abierta" : "abiertas"}`
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={clearFilters}
            className={pillClass(noFilters)}
          >
            Todas
          </button>
          {pills.map((p) => {
            const active = pill === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setPill((cur) => (cur === p.key ? null : p.key))}
                className={pillClass(active)}
              >
                {p.label}
                {p.badge ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[11px] font-bold",
                      active
                        ? "bg-white/20 text-white"
                        : "bg-electric/10 text-electric",
                    )}
                  >
                    {p.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        {canReadAll && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="only-mine"
              checked={onlyMine}
              onCheckedChange={(c) => setOnlyMine(c === true)}
            />
            <Label htmlFor="only-mine" className="text-sm leading-none">
              Solo mías
            </Label>
          </div>
        )}
      </div>

      {pill === "notif" ? (
        <NotificationsList />
      ) : isLoading ? (
        <p className="rounded-2xl border border-brand-border bg-surface px-6 py-16 text-center text-sm text-muted-brand">
          Cargando tareas…
        </p>
      ) : (
        <>
          {SECTIONS.map((sec) => {
            const rows = open.filter((t) => dueBucket(t, today) === sec.key);
            if (rows.length === 0) return null;
            return (
              <section key={sec.key} className="space-y-2">
                <h2 className="flex items-center gap-2 px-1">
                  <span className={cn("h-2 w-2 rounded-full", sec.dot)} />
                  <span className={cn("text-sm font-bold", sec.text)}>
                    {sec.label}
                  </span>
                  <span className="text-xs font-medium text-muted-brand">
                    {rows.length}
                  </span>
                </h2>
                {renderRows(rows)}
              </section>
            );
          })}

          {open.length === 0 && (
            <div className="rounded-2xl border border-dashed border-brand-border bg-surface px-6 py-14 text-center text-sm text-muted-brand">
              Nada pendiente acá.
            </div>
          )}

          {done.length > 0 && (
            <section className="space-y-2">
              <button
                type="button"
                onClick={() => setShowDone((v) => !v)}
                className="flex items-center gap-1.5 px-1 text-sm font-semibold text-slate-brand"
              >
                {showDone ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Completadas{" "}
                <span className="text-xs font-medium text-muted-brand">
                  {done.length}
                </span>
              </button>
              {showDone && renderRows(done)}
            </section>
          )}
        </>
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
