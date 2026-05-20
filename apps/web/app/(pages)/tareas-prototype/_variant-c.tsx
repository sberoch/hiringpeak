"use client";

/**
 * VARIANT C — "Split maestro-detalle".
 *
 * Thesis: fast triage. Two panes — a narrow task list on the left, the
 * selected task's editor INLINE on the right (no sheet/modal). "Nueva
 * tarea" opens a blank draft in the right pane. Notifications surface in
 * BOTH places: a bell dropdown in a faux top bar AND a pinned "Para vos"
 * attention block at the top of the left list. Dashboard widget = a thin
 * inline banner. Attachment picker = search-as-you-type command list.
 */

import { Bell, LayoutList, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@workspace/ui/lib/utils";
import { PageHeading } from "@workspace/ui/components/page-heading";

import {
  type AppNotification,
  type Task,
  INITIAL_NOTIFICATIONS,
  INITIAL_TASKS,
  NOTIF_LABEL,
  formatDue,
  isOverdue,
  relativeTime,
} from "./_mock-data";
import { AttachChip, NOTIF_ICON, OwnerAvatar } from "./_shared";
import { TaskForm } from "./_task-form";

const BLANK: Task = {
  id: "draft",
  title: "",
  dueDate: null,
  done: false,
  ownerId: "u1",
  createdById: "u1",
  attach: null,
};

export function VariantC() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [notifs, setNotifs] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>("t1");
  const [draft, setDraft] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  const list = useMemo(
    () =>
      tasks
        .filter((t) => (scope === "mine" ? t.ownerId === "u1" : true))
        .filter((t) => t.title.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => {
          if (a.done !== b.done) return a.done ? 1 : -1;
          return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
        }),
    [tasks, scope, q],
  );

  const counts = useMemo(() => {
    const open = tasks.filter((t) => !t.done && t.ownerId === "u1");
    return {
      overdue: open.filter(isOverdue).length,
      today: open.filter((t) => formatDue(t) === "Vence hoy").length,
    };
  }, [tasks]);

  const unread = notifs.filter((n) => !n.read);
  const selected = draft
    ? BLANK
    : (tasks.find((t) => t.id === selectedId) ?? null);

  const save = (t: Task) => {
    setTasks((prev) => {
      const exists = prev.some((p) => p.id === t.id);
      return exists ? prev.map((p) => (p.id === t.id ? t : p)) : [t, ...prev];
    });
    setDraft(false);
    setSelectedId(t.id);
  };
  const toggleDone = (id: string) =>
    setTasks((prev) =>
      prev.map((p) => (p.id === id ? { ...p, done: !p.done } : p)),
    );
  const markRead = (id: string) =>
    setNotifs((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const selectByTitle = (title: string) => {
    const t = tasks.find((x) => x.title === title);
    if (t) {
      setDraft(false);
      setSelectedId(t.id);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Faux top bar with bell dropdown */}
      <div className="flex items-start justify-between gap-4">
        <PageHeading
          icon={LayoutList}
          title="Tareas"
          description="Lista a la izquierda, edición al instante a la derecha."
        />
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => setBellOpen((o) => !o)}
            className={cn(
              "relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-surface text-ink transition-all hover:border-electric/30",
              bellOpen && "border-electric/40 bg-electric/[0.06]",
            )}
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5" />
            {unread.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unread.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(true);
              setBellOpen(false);
            }}
            className="inline-flex items-center gap-2 rounded-md bg-electric px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-electric-light hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.3)]"
          >
            <Plus className="h-4 w-4" />
            Nueva tarea
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-brand-border bg-surface shadow-[0_16px_40px_-12px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between border-b border-brand-border px-4 py-2.5">
                <span className="text-sm font-semibold text-ink">
                  Notificaciones
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setNotifs((p) => p.map((n) => ({ ...n, read: true })))
                  }
                  className="text-xs font-medium text-electric hover:underline"
                >
                  Leídas
                </button>
              </div>
              <div className="max-h-80 overflow-auto">
                {notifs.map((n, i) => {
                  const meta = NOTIF_ICON[n.kind];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        markRead(n.id);
                        selectByTitle(n.taskTitle);
                        setBellOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-canvas",
                        i !== 0 && "border-t border-brand-border",
                        !n.read && "bg-electric/[0.04]",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                          meta.bg,
                        )}
                      >
                        <Icon className={cn("h-3.5 w-3.5", meta.tone)} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block text-xs",
                            n.read
                              ? "text-slate-brand"
                              : "font-semibold text-ink",
                          )}
                        >
                          {NOTIF_LABEL[n.kind]}
                        </span>
                        <span className="block truncate text-[11px] text-slate-brand">
                          «{n.taskTitle}»
                        </span>
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-brand">
                        {relativeTime(n.agoMinutes)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Thin dashboard-widget banner */}
      <div className="flex items-center gap-4 rounded-xl border border-brand-border bg-surface px-4 py-2.5 text-sm">
        <span className="font-semibold text-ink">Resumen</span>
        <span className="text-red-600">
          <strong>{counts.overdue}</strong> vencidas
        </span>
        <span className="text-amber-600">
          <strong>{counts.today}</strong> vencen hoy
        </span>
        <span className="ml-auto text-xs text-muted-brand">
          Solo tus tareas
        </span>
      </div>

      {/* Split */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">
        {/* Left: list */}
        <div className="flex flex-col gap-3">
          <div className="inline-flex w-full rounded-lg border border-brand-border bg-surface p-1">
            {(["mine", "all"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  scope === s
                    ? "bg-electric text-white"
                    : "text-ink hover:bg-brand-border-light",
                )}
              >
                {s === "mine" ? "Mis tareas" : "Todas"}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-brand" />
            <input
              value={q}
              onChange={(ev) => setQ(ev.target.value)}
              placeholder="Buscar tarea…"
              className="w-full rounded-xl border border-brand-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-electric focus:shadow-[0_0_0_4px_rgba(0,102,255,0.1)]"
            />
          </div>

          {/* Pinned "Para vos" attention block */}
          {unread.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-electric/25 bg-electric/[0.04]">
              <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-electric">
                Para vos
              </p>
              {unread.slice(0, 3).map((n) => {
                const meta = NOTIF_ICON[n.kind];
                const Icon = meta.icon;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      markRead(n.id);
                      selectByTitle(n.taskTitle);
                    }}
                    className="flex w-full items-center gap-2 border-t border-electric/15 px-3 py-2 text-left transition-colors hover:bg-white"
                  >
                    <Icon className={cn("h-3.5 w-3.5 shrink-0", meta.tone)} />
                    <span className="min-w-0 flex-1 truncate text-xs text-ink">
                      {n.kind === "assigned"
                        ? `${n.byUser} te asignó «${n.taskTitle}»`
                        : `«${n.taskTitle}» ${n.kind === "overdue" ? "está vencida" : "vence hoy"}`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-brand-border bg-surface">
            {list.length === 0 && (
              <p className="px-4 py-12 text-center text-sm text-muted-brand">
                Sin resultados.
              </p>
            )}
            {list.map((t, i) => {
              const over = isOverdue(t);
              const active = !draft && selectedId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setDraft(false);
                    setSelectedId(t.id);
                  }}
                  className={cn(
                    "relative flex w-full items-center gap-2.5 py-2.5 pl-4 pr-3 text-left transition-colors",
                    i !== 0 && "border-t border-brand-border",
                    active ? "bg-electric/[0.07]" : "hover:bg-canvas",
                    t.done && "opacity-50",
                  )}
                >
                  {over && (
                    <span className="absolute left-0 top-0 h-full w-1 bg-red-500" />
                  )}
                  <span
                    role="checkbox"
                    aria-checked={t.done}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      toggleDone(t.id);
                    }}
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all",
                      t.done
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-brand-border hover:border-electric",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-sm font-medium text-ink",
                        t.done && "line-through",
                      )}
                    >
                      {t.title || "Sin título"}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-semibold",
                        over ? "text-red-600" : "text-muted-brand",
                      )}
                    >
                      {formatDue(t)}
                    </span>
                  </span>
                  <OwnerAvatar ownerId={t.ownerId} size="sm" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: inline detail/editor */}
        <div className="rounded-2xl border border-brand-border bg-surface p-6">
          {selected ? (
            <>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight text-ink">
                  {draft ? "Nueva tarea" : "Editar tarea"}
                </h2>
                {!draft && selected.attach && (
                  <AttachChip attach={selected.attach} />
                )}
              </div>
              <TaskForm
                key={draft ? "draft" : selected.id}
                task={draft ? null : selected}
                pickerStyle="command"
                onSave={save}
                onCancel={
                  draft ? () => setDraft(false) : undefined
                }
              />
            </>
          ) : (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
              <LayoutList className="mb-3 h-8 w-8 text-muted-brand" />
              <p className="text-sm font-medium text-ink">
                Elegí una tarea
              </p>
              <p className="text-xs text-muted-brand">
                Seleccioná una de la lista para verla y editarla acá.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tasks-in-context: mocked Vacancy ficha feeding the same right pane */}
      <ContextCard
        tasks={tasks}
        onSelect={(id) => {
          setDraft(false);
          setSelectedId(id);
        }}
      />
    </div>
  );
}

function ContextCard({
  tasks,
  onSelect,
}: {
  tasks: Task[];
  onSelect: (id: string) => void;
}) {
  const vacancyTasks = tasks.filter(
    (t) => t.attach?.id === "v1" && !t.done,
  );
  return (
    <div className="rounded-2xl border border-dashed border-brand-border bg-canvas p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-brand">
        Vista de contexto · tareas dentro de la ficha de vacante (clic = editar
        arriba)
      </p>
      <div className="rounded-xl border border-brand-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-ink">
              Director Financiero
            </p>
            <p className="text-xs text-slate-brand">Grupo Aldama</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-electric/40 hover:bg-electric/5"
          >
            <Plus className="h-3.5 w-3.5" />
            Tarea
          </button>
        </div>
        <div className="mt-3 space-y-1 border-t border-brand-border pt-3">
          {vacancyTasks.length === 0 && (
            <p className="text-xs text-muted-brand">Sin tareas abiertas.</p>
          )}
          {vacancyTasks.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-electric/[0.06]"
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
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
