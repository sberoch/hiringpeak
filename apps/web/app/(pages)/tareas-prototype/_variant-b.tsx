"use client";

/**
 * VARIANT B — "Panel de vencimientos".
 *
 * Thesis: Tasks are a deadline-triage problem. Reuses the dashboard
 * stat-card visual language: 4 clickable tiles ARE the primary filter.
 * "Mis tareas" vs "Todas" is a top tab. The list is one flat list GROUPED
 * by due bucket (no kanban columns). Notifications are a DEDICATED view
 * behind a bell (conceptually distinct from tasks). Create = ONE global
 * button. Edit happens inline (row expands — no sheet/modal). The
 * attachment picker is the simplest possible: two plain selects.
 */

import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CalendarOff,
  ChevronDown,
  ListChecks,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@workspace/ui/lib/utils";
import { PageHeading } from "@workspace/ui/components/page-heading";

import {
  type AppNotification,
  type DueBucket,
  type Task,
  BUCKET_LABEL,
  INITIAL_NOTIFICATIONS,
  INITIAL_TASKS,
  NOTIF_LABEL,
  dueBucket,
  formatDue,
  isOverdue,
  relativeTime,
} from "./_mock-data";
import { AttachChip, BellButton, NOTIF_ICON, OwnerAvatar } from "./_shared";
import { TaskForm } from "./_task-form";

const ORDER: DueBucket[] = ["overdue", "today", "week", "later", "none"];

const TILES: {
  bucket: Exclude<DueBucket, "later">;
  label: string;
  icon: LucideIcon;
  cardBg: string;
  iconBg: string;
  value: string;
}[] = [
  {
    bucket: "overdue",
    label: "Vencidas",
    icon: AlertTriangle,
    cardBg: "bg-red-50",
    iconBg: "bg-red-500 shadow-[0_2px_8px_-2px_rgba(239,68,68,0.4)]",
    value: "text-red-600",
  },
  {
    bucket: "today",
    label: "Vence hoy",
    icon: CalendarClock,
    cardBg: "bg-amber-50",
    iconBg: "bg-amber-500 shadow-[0_2px_8px_-2px_rgba(245,158,11,0.4)]",
    value: "text-amber-600",
  },
  {
    bucket: "week",
    label: "Esta semana",
    icon: CalendarDays,
    cardBg: "bg-[#f0f6ff]",
    iconBg: "bg-electric shadow-[0_2px_8px_-2px_rgba(0,102,255,0.4)]",
    value: "text-electric",
  },
  {
    bucket: "none",
    label: "Sin fecha",
    icon: CalendarOff,
    cardBg: "bg-canvas",
    iconBg: "bg-slate-400 shadow-[0_2px_8px_-2px_rgba(100,116,139,0.4)]",
    value: "text-slate-brand",
  },
];

export function VariantB() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [notifs, setNotifs] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [bucketFilter, setBucketFilter] = useState<DueBucket | null>(null);
  const [view, setView] = useState<"board" | "notif">("board");
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const scoped = useMemo(
    () =>
      tasks.filter((t) =>
        scope === "mine" ? t.ownerId === "u1" && !t.done : !t.done,
      ),
    [tasks, scope],
  );

  const tileCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of scoped) c[dueBucket(t)] = (c[dueBucket(t)] ?? 0) + 1;
    return c;
  }, [scoped]);

  const grouped = useMemo(() => {
    const visible = bucketFilter
      ? scoped.filter((t) => dueBucket(t) === bucketFilter)
      : scoped;
    return ORDER.map((b) => ({
      bucket: b,
      items: visible
        .filter((t) => dueBucket(t) === b)
        .sort((a, z) => (a.dueDate ?? "9999").localeCompare(z.dueDate ?? "9999")),
    })).filter((g) => g.items.length > 0);
  }, [scoped, bucketFilter]);

  const unread = notifs.filter((n) => !n.read).length;

  const save = (t: Task) => {
    setTasks((prev) => {
      const exists = prev.some((p) => p.id === t.id);
      return exists ? prev.map((p) => (p.id === t.id ? t : p)) : [t, ...prev];
    });
    setCreating(false);
    setExpandedId(null);
  };
  const toggleDone = (id: string) =>
    setTasks((prev) =>
      prev.map((p) => (p.id === id ? { ...p, done: !p.done } : p)),
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeading
          icon={ListChecks}
          title="Tareas"
          description="Priorizá por vencimiento. Lo urgente primero."
        />
        <div className="flex items-center gap-2">
          <BellButton
            unread={unread}
            active={view === "notif"}
            onClick={() => setView((v) => (v === "notif" ? "board" : "notif"))}
          />
          <button
            type="button"
            onClick={() => {
              setView("board");
              setCreating((c) => !c);
            }}
            className="inline-flex items-center gap-2 rounded-md bg-electric px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-electric-light hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.3)]"
          >
            <Plus className="h-4 w-4" />
            Nueva tarea
          </button>
        </div>
      </div>

      {view === "notif" ? (
        <NotifPage
          notifs={notifs}
          onToggle={(id) =>
            setNotifs((p) =>
              p.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
            )
          }
          onAllRead={() =>
            setNotifs((p) => p.map((n) => ({ ...n, read: true })))
          }
          onBack={() => setView("board")}
        />
      ) : (
        <>
          {/* Stat tiles == primary filter */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {TILES.map((tile) => {
              const Icon = tile.icon;
              const active = bucketFilter === tile.bucket;
              return (
                <button
                  key={tile.bucket}
                  type="button"
                  onClick={() =>
                    setBucketFilter(active ? null : tile.bucket)
                  }
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-1",
                    tile.cardBg,
                    active
                      ? "border-electric ring-2 ring-electric/20"
                      : "border-brand-border",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl text-white",
                        tile.iconBg,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div
                        className={cn(
                          "text-2xl font-bold tracking-tight",
                          tile.value,
                        )}
                      >
                        {tileCounts[tile.bucket] ?? 0}
                      </div>
                      <div className="text-sm text-slate-brand">
                        {tile.label}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Scope tabs */}
          <div className="flex items-center justify-between">
            <div className="inline-flex rounded-lg border border-brand-border bg-surface p-1">
              {(["mine", "all"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className={cn(
                    "rounded-md px-4 py-1.5 text-sm font-medium transition-all",
                    scope === s
                      ? "bg-electric text-white"
                      : "text-ink hover:bg-brand-border-light",
                  )}
                >
                  {s === "mine" ? "Mis tareas" : "Todas"}
                </button>
              ))}
            </div>
            {bucketFilter && (
              <button
                type="button"
                onClick={() => setBucketFilter(null)}
                className="text-xs font-medium text-electric hover:underline"
              >
                Quitar filtro «{BUCKET_LABEL[bucketFilter]}»
              </button>
            )}
          </div>

          {creating && (
            <div className="rounded-2xl border border-electric/30 bg-electric/[0.03] p-5">
              <p className="mb-4 text-sm font-bold text-ink">Nueva tarea</p>
              <TaskForm
                pickerStyle="dropdown"
                onSave={save}
                onCancel={() => setCreating(false)}
              />
            </div>
          )}

          {/* Grouped flat list */}
          <div className="flex flex-col gap-6">
            {grouped.length === 0 && (
              <p className="rounded-2xl border border-brand-border bg-surface px-6 py-16 text-center text-sm text-muted-brand">
                No hay tareas abiertas en esta vista.
              </p>
            )}
            {grouped.map((g) => (
              <section key={g.bucket}>
                <div className="mb-2 flex items-center gap-2 px-1">
                  <h2
                    className={cn(
                      "text-sm font-bold tracking-tight",
                      g.bucket === "overdue" ? "text-red-600" : "text-ink",
                    )}
                  >
                    {BUCKET_LABEL[g.bucket]}
                  </h2>
                  <span className="rounded-full bg-brand-border-light px-2 text-[11px] font-semibold text-slate-brand">
                    {g.items.length}
                  </span>
                </div>
                <div
                  className={cn(
                    "overflow-hidden rounded-2xl border bg-surface",
                    g.bucket === "overdue"
                      ? "border-red-200"
                      : "border-brand-border",
                  )}
                >
                  {g.items.map((t, i) => {
                    const open = expandedId === t.id;
                    return (
                      <div
                        key={t.id}
                        className={cn(
                          i !== 0 && "border-t border-brand-border",
                          g.bucket === "overdue" && !open && "bg-red-50/40",
                        )}
                      >
                        <div className="flex items-center gap-3 px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleDone(t.id)}
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-brand-border transition-all hover:border-electric"
                            aria-label="Completar"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(open ? null : t.id)
                            }
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-ink">
                                {t.title}
                              </span>
                              <span className="mt-1 flex items-center gap-2">
                                <AttachChip attach={t.attach} />
                              </span>
                            </span>
                            <span
                              className={cn(
                                "shrink-0 text-xs font-semibold",
                                isOverdue(t)
                                  ? "text-red-600"
                                  : "text-slate-brand",
                              )}
                            >
                              {formatDue(t)}
                            </span>
                            <OwnerAvatar ownerId={t.ownerId} size="sm" />
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 shrink-0 text-muted-brand transition-transform",
                                open && "rotate-180",
                              )}
                            />
                          </button>
                        </div>
                        {open && (
                          <div className="border-t border-brand-border bg-canvas px-4 py-4">
                            <TaskForm
                              task={t}
                              pickerStyle="dropdown"
                              onSave={save}
                              onCancel={() => setExpandedId(null)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <ContextCard tasks={tasks} onAdd={() => setCreating(true)} />
        </>
      )}
    </div>
  );
}

function NotifPage({
  notifs,
  onToggle,
  onAllRead,
  onBack,
}: {
  notifs: AppNotification[];
  onToggle: (id: string) => void;
  onAllRead: () => void;
  onBack: () => void;
}) {
  const unread = notifs.filter((n) => !n.read);
  const read = notifs.filter((n) => n.read);
  const Section = ({
    title,
    list,
  }: {
    title: string;
    list: AppNotification[];
  }) =>
    list.length === 0 ? null : (
      <section>
        <h2 className="mb-2 text-sm font-bold text-ink">{title}</h2>
        <div className="overflow-hidden rounded-2xl border border-brand-border bg-surface">
          {list.map((n, i) => {
            const meta = NOTIF_ICON[n.kind];
            const Icon = meta.icon;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => onToggle(n.id)}
                className={cn(
                  "flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-canvas",
                  i !== 0 && "border-t border-brand-border",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    meta.bg,
                  )}
                >
                  <Icon className={cn("h-4 w-4", meta.tone)} />
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm",
                      n.read
                        ? "text-slate-brand"
                        : "font-semibold text-ink",
                    )}
                  >
                    {NOTIF_LABEL[n.kind]}
                  </p>
                  <p className="text-xs text-slate-brand">
                    {n.kind === "assigned" && n.byUser
                      ? `${n.byUser} · `
                      : ""}
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
      </section>
    );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-electric hover:underline"
        >
          ← Volver al panel
        </button>
        <button
          type="button"
          onClick={onAllRead}
          className="text-xs font-medium text-electric hover:underline"
        >
          Marcar todo como leído
        </button>
      </div>
      <Section title={`Sin leer (${unread.length})`} list={unread} />
      <Section title="Anteriores" list={read} />
    </div>
  );
}

/** Tasks-in-context: a mocked Company ficha with per-entity "+ Tarea". */
function ContextCard({
  tasks,
  onAdd,
}: {
  tasks: Task[];
  onAdd: () => void;
}) {
  const aldama = tasks.filter((t) => t.attach?.id === "co1" && !t.done);
  return (
    <div className="rounded-2xl border border-dashed border-brand-border bg-canvas p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-brand">
        Vista de contexto · tareas dentro de la ficha de empresa
      </p>
      <div className="rounded-xl border border-brand-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-ink">Grupo Aldama</p>
            <p className="text-xs text-slate-brand">Cliente activo</p>
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-electric/40 hover:bg-electric/5"
          >
            <Plus className="h-3.5 w-3.5" />
            Tarea
          </button>
        </div>
        <div className="mt-3 space-y-1.5 border-t border-brand-border pt-3">
          {aldama.length === 0 && (
            <p className="text-xs text-muted-brand">Sin tareas abiertas.</p>
          )}
          {aldama.map((t) => (
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
