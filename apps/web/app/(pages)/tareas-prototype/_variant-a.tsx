"use client";

/**
 * VARIANT A — "Bandeja unificada".
 *
 * Thesis: Tareas and Notificaciones are the SAME prioritised surface. One
 * dense column, chip filters, the notification list is just another chip
 * (no separate page, no bell view). Create = ONE global button. Per-entity
 * "+ Tarea" also exists (shown in the context card) but feeds the same sheet.
 * Edit/create happens in a right-side Sheet (matches new-user-sheet pattern).
 */

import {
  Briefcase,
  Building2,
  LayoutDashboard,
  ListTodo,
  Plus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@workspace/ui/lib/utils";
import { PageHeading } from "@workspace/ui/components/page-heading";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";

import {
  type AppNotification,
  type Task,
  INITIAL_NOTIFICATIONS,
  INITIAL_TASKS,
  NOTIF_LABEL,
  dueBucket,
  formatDue,
  isOverdue,
  relativeTime,
} from "./_mock-data";
import {
  AttachChip,
  DueSummaryStrip,
  NOTIF_ICON,
  OwnerAvatar,
} from "./_shared";
import { TaskForm } from "./_task-form";

type Chip = "mine" | "all" | "overdue" | "none" | "notif";

export function VariantA() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [notifs, setNotifs] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [chip, setChip] = useState<Chip>("mine");
  const [editing, setEditing] = useState<Task | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [presetAttach, setPresetAttach] =
    useState<Task["attach"] | null>(null);

  const counts = useMemo(() => {
    const open = tasks.filter((t) => !t.done);
    return {
      overdue: open.filter((t) => dueBucket(t) === "overdue").length,
      today: open.filter((t) => dueBucket(t) === "today").length,
      week: open.filter((t) => dueBucket(t) === "week").length,
      unread: notifs.filter((n) => !n.read).length,
    };
  }, [tasks, notifs]);

  const filtered = useMemo(() => {
    if (chip === "notif") return [];
    return tasks
      .filter((t) => {
        if (chip === "mine") return t.ownerId === "u1";
        if (chip === "overdue") return isOverdue(t);
        if (chip === "none") return !t.dueDate;
        return true;
      })
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        const ad = a.dueDate ?? "9999";
        const bd = b.dueDate ?? "9999";
        return ad.localeCompare(bd);
      });
  }, [tasks, chip]);

  const openNew = (preset?: Task["attach"]) => {
    setEditing(null);
    setPresetAttach(preset ?? null);
    setSheetOpen(true);
  };
  const openEdit = (t: Task) => {
    setEditing(t);
    setPresetAttach(null);
    setSheetOpen(true);
  };
  const save = (t: Task) => {
    setTasks((prev) => {
      const exists = prev.some((p) => p.id === t.id);
      return exists ? prev.map((p) => (p.id === t.id ? t : p)) : [t, ...prev];
    });
    setSheetOpen(false);
  };
  const toggleDone = (id: string) =>
    setTasks((prev) =>
      prev.map((p) => (p.id === id ? { ...p, done: !p.done } : p)),
    );

  const chips: { key: Chip; label: string; badge?: number }[] = [
    { key: "mine", label: "Mis tareas" },
    { key: "all", label: "Todas" },
    { key: "overdue", label: "Vencidas", badge: counts.overdue },
    { key: "none", label: "Sin fecha" },
    { key: "notif", label: "Notificaciones", badge: counts.unread },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeading
          icon={ListTodo}
          title="Tareas"
          description="Tu bandeja de pendientes y avisos, todo en un solo lugar."
        />
        <button
          type="button"
          onClick={() => openNew()}
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-electric px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-electric-light hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.3)]"
        >
          <Plus className="h-4 w-4" />
          Nueva tarea
        </button>
      </div>

      <DueSummaryStrip
        overdue={counts.overdue}
        today={counts.today}
        week={counts.week}
      />

      <div className="flex flex-wrap items-center gap-2">
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setChip(c.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
              chip === c.key
                ? "bg-electric text-white shadow-[0_2px_8px_-2px_rgba(0,102,255,0.4)]"
                : "bg-surface text-ink ring-1 ring-brand-border hover:ring-electric/30",
            )}
          >
            {c.label}
            {c.badge ? (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] font-bold",
                  chip === c.key
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
        ))}
      </div>

      {chip === "notif" ? (
        <NotifList
          notifs={notifs}
          onToggle={(id) =>
            setNotifs((p) =>
              p.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
            )
          }
          onAllRead={() =>
            setNotifs((p) => p.map((n) => ({ ...n, read: true })))
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-brand-border bg-surface">
          {filtered.length === 0 && (
            <p className="px-6 py-16 text-center text-sm text-muted-brand">
              No hay tareas en esta vista.
            </p>
          )}
          {filtered.map((t, i) => {
            const over = isOverdue(t);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => openEdit(t)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-canvas",
                  i !== 0 && "border-t border-brand-border",
                  t.done && "opacity-55",
                )}
              >
                <span
                  role="checkbox"
                  aria-checked={t.done}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    toggleDone(t.id);
                  }}
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                    t.done
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-brand-border hover:border-electric",
                  )}
                >
                  {t.done && (
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
                      t.done && "line-through",
                    )}
                  >
                    {t.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <AttachChip attach={t.attach} />
                  </div>
                </div>

                <span
                  className={cn(
                    "shrink-0 text-xs font-semibold",
                    over
                      ? "text-red-600"
                      : formatDue(t) === "Vence hoy"
                        ? "text-amber-600"
                        : "text-slate-brand",
                  )}
                >
                  {formatDue(t)}
                </span>
                <OwnerAvatar ownerId={t.ownerId} size="sm" />
              </button>
            );
          })}
        </div>
      )}

      <SidebarBadgeDemo tasks={tasks} />

      <ContextCard onAddTask={(att) => openNew(att)} tasks={tasks} />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[90%] overflow-y-auto bg-surface sm:w-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold text-ink">
              {editing ? "Editar tarea" : "Nueva tarea"}
            </SheetTitle>
            <SheetDescription className="text-slate-brand">
              {editing
                ? "Modificá los datos de la tarea."
                : "Creá una tarea y asignala a quien corresponda."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 py-4">
            {sheetOpen && (
              <TaskForm
                task={editing}
                presetAttach={presetAttach}
                pickerStyle="segmented"
                onSave={save}
                onCancel={() => setSheetOpen(false)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function NotifList({
  notifs,
  onToggle,
  onAllRead,
}: {
  notifs: AppNotification[];
  onToggle: (id: string) => void;
  onAllRead: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-border bg-surface">
      <div className="flex items-center justify-between border-b border-brand-border px-4 py-2.5">
        <span className="text-sm font-semibold text-ink">
          Notificaciones
        </span>
        <button
          type="button"
          onClick={onAllRead}
          className="text-xs font-medium text-electric hover:underline"
        >
          Marcar todo como leído
        </button>
      </div>
      {notifs.map((n, i) => {
        const meta = NOTIF_ICON[n.kind];
        const Icon = meta.icon;
        return (
          <button
            key={n.id}
            type="button"
            onClick={() => onToggle(n.id)}
            className={cn(
              "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
              i !== 0 && "border-t border-brand-border",
              n.read ? "bg-surface" : "bg-electric/[0.04]",
            )}
          >
            {!n.read && (
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-electric" />
            )}
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                meta.bg,
                n.read && "opacity-60",
              )}
            >
              <Icon className={cn("h-4 w-4", meta.tone)} />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm",
                  n.read
                    ? "font-normal text-slate-brand"
                    : "font-semibold text-ink",
                )}
              >
                {NOTIF_LABEL[n.kind]}
              </p>
              <p className="truncate text-xs text-slate-brand">
                {n.kind === "assigned" && n.byUser ? `${n.byUser}: ` : ""}
                «{n.taskTitle}»
              </p>
            </div>
            <span className="shrink-0 text-[11px] text-muted-brand">
              {relativeTime(n.agoMinutes)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Global "always know I have X tasks" signal — a count of YOUR total open
 * tasks on the "Tareas" sidebar item (no overdue breakdown — that's the
 * notification bell's axis). Shown here as a faithful mock of the real
 * sidebar nav slice (the real sidebar is shared chrome and Tareas is
 * unbuilt — wire this in at implementation). The "En vivo" mock reads the
 * in-memory tasks, so completing tasks above updates the count.
 */
function TareasBadge({ open }: { open: number }) {
  if (open === 0) return null;
  return (
    <span className="ml-auto text-[11px] font-semibold text-muted-brand">
      {open}
    </span>
  );
}

function NavRow({
  icon: Icon,
  label,
  active,
  badge,
}: {
  icon: typeof Users;
  label: string;
  active?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium",
        active
          ? "bg-electric/[0.08] text-electric"
          : "text-slate-brand",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
      {badge}
    </div>
  );
}

function SidebarBadgeDemo({ tasks }: { tasks: Task[] }) {
  const open = tasks.filter((t) => t.ownerId === "u1" && !t.done).length;

  return (
    <div className="rounded-2xl border border-dashed border-brand-border bg-canvas p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-brand">
        Señal global · contador de tus tareas abiertas en el ítem «Tareas» del
        menú (visible en toda la app)
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* En vivo — reads the tasks state above */}
        <div>
          <p className="mb-1.5 text-xs font-semibold text-ink">
            En vivo (tus tareas abiertas)
          </p>
          <div className="rounded-xl border border-brand-border bg-surface p-2">
            <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-brand">
              Espacio de trabajo
            </p>
            <NavRow icon={LayoutDashboard} label="Dashboard" />
            <NavRow icon={Users} label="Postulantes" />
            <NavRow
              icon={ListTodo}
              label="Tareas"
              active
              badge={<TareasBadge open={open} />}
            />
            <NavRow icon={Briefcase} label="Vacantes" />
            <NavRow icon={Building2} label="Empresas" />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-brand">
            Total de tus tareas abiertas. Completá tareas arriba y mirá cómo
            baja.
          </p>
        </div>

        {/* Empty */}
        <div>
          <p className="mb-1.5 text-xs font-semibold text-ink">Sin tareas</p>
          <div className="rounded-xl border border-brand-border bg-surface p-2">
            <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-brand">
              Espacio de trabajo
            </p>
            <NavRow icon={LayoutDashboard} label="Dashboard" />
            <NavRow icon={Users} label="Postulantes" />
            <NavRow
              icon={ListTodo}
              label="Tareas"
              badge={<TareasBadge open={0} />}
            />
            <NavRow icon={Briefcase} label="Vacantes" />
            <NavRow icon={Building2} label="Empresas" />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-brand">
            Nada que mostrar: el ítem queda limpio.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Tasks-in-context: a mocked candidate ficha with its own open tasks. */
function ContextCard({
  tasks,
  onAddTask,
}: {
  tasks: Task[];
  onAddTask: (att: Task["attach"]) => void;
}) {
  const carla = tasks.filter(
    (t) => t.attach?.id === "c1" && !t.done,
  );
  const attach = { id: "c1", type: "candidate" as const, label: "Carla Méndez" };
  return (
    <div className="rounded-2xl border border-dashed border-brand-border bg-canvas p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-brand">
        Vista de contexto · cómo se ven las tareas dentro de una ficha
      </p>
      <div className="rounded-xl border border-brand-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-electric/10 text-sm font-semibold text-electric">
              CM
            </span>
            <div>
              <p className="text-sm font-bold text-ink">Carla Méndez</p>
              <p className="text-xs text-slate-brand">
                Directora Financiera · ★ 4.5
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAddTask(attach)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-electric/40 hover:bg-electric/5"
          >
            <Plus className="h-3.5 w-3.5" />
            Tarea
          </button>
        </div>
        <div className="mt-3 space-y-1.5 border-t border-brand-border pt-3">
          {carla.length === 0 && (
            <p className="text-xs text-muted-brand">Sin tareas abiertas.</p>
          )}
          {carla.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="truncate text-ink">{t.title}</span>
              <span
                className={cn(
                  "shrink-0 text-xs font-semibold",
                  isOverdue(t) ? "text-red-600" : "text-slate-brand",
                )}
              >
                {formatDue(t)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
