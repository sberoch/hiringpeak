"use client";

/**
 * THROWAWAY PROTOTYPE — task create/edit form.
 *
 * Shared like an atom (fields are the same everywhere) but the ATTACHMENT
 * PICKER is one of the open UX questions, so it ships in 3 styles selected
 * per-variant via `pickerStyle`:
 *   - "segmented": type chips + filterable result list (closest to the
 *     existing candidate/vacancy pickers — reuse spirit).  [Variant A]
 *   - "dropdown": two plain selects (type, then entity). Simplest.  [Variant B]
 *   - "command": type tabs + search-as-you-type command list.  [Variant C]
 *
 * Constraint honoured: a Task attaches to AT MOST ONE of
 * Candidate/Vacancy/Candidacy/Company, or none (standalone).
 */

import { Check, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@workspace/ui/lib/utils";

import {
  type AttachEntity,
  type EntityType,
  type Task,
  ENTITIES,
  ENTITY_TYPE_LABEL,
  USERS,
} from "./_mock-data";
import { ENTITY_ICON } from "./_shared";

const ATTACH_TYPES: Exclude<EntityType, "none">[] = [
  "candidate",
  "vacancy",
  "candidacy",
  "company",
];

export type PickerStyle = "segmented" | "dropdown" | "command";

interface TaskFormProps {
  /** Existing task to edit, or null for a new task. */
  task?: Task | null;
  /** Pre-attach to an entity (per-entity "+ Tarea" entry point). */
  presetAttach?: AttachEntity | null;
  pickerStyle: PickerStyle;
  onSave: (t: Task) => void;
  onCancel?: () => void;
}

const fieldLabel = "text-sm font-semibold text-ink";
const inputBase =
  "w-full rounded-xl border border-brand-border bg-canvas px-3 py-2 text-sm text-ink outline-none transition-all placeholder:text-muted-brand focus:border-electric focus:shadow-[0_0_0_4px_rgba(0,102,255,0.1)]";

export function TaskForm({
  task,
  presetAttach,
  pickerStyle,
  onSave,
  onCancel,
}: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [ownerId, setOwnerId] = useState(task?.ownerId ?? "u1");
  const [dueDate, setDueDate] = useState<string | null>(task?.dueDate ?? null);
  const [done, setDone] = useState(task?.done ?? false);
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [attach, setAttach] = useState<AttachEntity | null>(
    task?.attach ?? presetAttach ?? null,
  );

  const submit = () => {
    onSave({
      id: task?.id ?? `tmp-${Date.now()}`,
      title: title.trim() || "Tarea sin título",
      dueDate,
      done,
      ownerId,
      createdById: task?.createdById ?? "u1",
      attach,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className={fieldLabel}>Título</label>
        <input
          autoFocus
          value={title}
          onChange={(ev) => setTitle(ev.target.value)}
          placeholder="¿Qué hay que hacer?"
          className={inputBase}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={fieldLabel}>Responsable</label>
          <select
            value={ownerId}
            onChange={(ev) => setOwnerId(ev.target.value)}
            className={inputBase}
          >
            {USERS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
                {u.isMe ? " (vos)" : ""}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted-brand">
            Podés asignarla a un colega.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={fieldLabel}>
            Fecha límite{" "}
            <span className="font-normal text-muted-brand">(opcional)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dueDate ?? ""}
              onChange={(ev) => setDueDate(ev.target.value || null)}
              className={cn(inputBase, "flex-1")}
            />
            {dueDate && (
              <button
                type="button"
                onClick={() => setDueDate(null)}
                className="rounded-lg px-2 py-1 text-xs font-medium text-slate-brand hover:bg-brand-border-light"
              >
                Quitar
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-brand">
            Sin fecha = pendiente de backlog, no genera avisos.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setDone((d) => !d)}
        className={cn(
          "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
          done
            ? "border-emerald-300 bg-emerald-50"
            : "border-brand-border bg-canvas hover:border-electric/30",
        )}
      >
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all",
            done
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-brand-border bg-surface text-transparent",
          )}
        >
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
        <span className="text-sm font-medium text-ink">
          {done ? "Tarea completada" : "Marcar como completada"}
        </span>
      </button>

      <div className="flex flex-col gap-1.5">
        <label className={fieldLabel}>Vínculo</label>
        <AttachmentPicker
          style={pickerStyle}
          value={attach}
          onChange={setAttach}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={fieldLabel}>Notas</label>
        <textarea
          value={notes}
          onChange={(ev) => setNotes(ev.target.value)}
          rows={3}
          placeholder="Contexto, próximos pasos…"
          className={cn(inputBase, "resize-none")}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm font-medium text-ink hover:bg-brand-border-light"
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          onClick={submit}
          className="rounded-md bg-electric px-5 py-2 text-sm font-semibold text-white shadow-none transition-all hover:bg-electric-light hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.3)]"
        >
          {task ? "Guardar cambios" : "Crear tarea"}
        </button>
      </div>
    </div>
  );
}

// ── Attachment picker, 3 styles ──────────────────────────────────────────────

function AttachmentPicker({
  style,
  value,
  onChange,
}: {
  style: PickerStyle;
  value: AttachEntity | null;
  onChange: (e: AttachEntity | null) => void;
}) {
  if (style === "dropdown") return <DropdownPicker value={value} onChange={onChange} />;
  if (style === "command") return <CommandPicker value={value} onChange={onChange} />;
  return <SegmentedPicker value={value} onChange={onChange} />;
}

function SelectedPill({
  value,
  onClear,
}: {
  value: AttachEntity;
  onClear: () => void;
}) {
  const Icon = ENTITY_ICON[value.type];
  return (
    <div className="flex items-center justify-between rounded-xl border border-electric/30 bg-electric/[0.06] px-3 py-2">
      <span className="flex items-center gap-2 text-sm font-medium text-ink">
        <Icon className="h-4 w-4 text-electric" />
        {value.label}
        <span className="text-xs font-normal text-slate-brand">
          · {ENTITY_TYPE_LABEL[value.type]}
        </span>
      </span>
      <button
        type="button"
        onClick={onClear}
        className="rounded-md p-1 text-slate-brand hover:bg-white"
        aria-label="Quitar vínculo"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function SegmentedPicker({
  value,
  onChange,
}: {
  value: AttachEntity | null;
  onChange: (e: AttachEntity | null) => void;
}) {
  const [type, setType] = useState<Exclude<EntityType, "none"> | null>(
    value?.type ?? null,
  );
  const [q, setQ] = useState("");

  if (value) return <SelectedPill value={value} onClear={() => { onChange(null); setType(null); }} />;

  const results = ENTITIES.filter(
    (e) => e.type === type && e.label.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="rounded-xl border border-brand-border bg-canvas p-3">
      <div className="flex flex-wrap gap-1.5">
        <TypeChip active={type === null} onClick={() => setType(null)}>
          Ninguno
        </TypeChip>
        {ATTACH_TYPES.map((t) => (
          <TypeChip key={t} active={type === t} onClick={() => setType(t)}>
            {ENTITY_TYPE_LABEL[t]}
          </TypeChip>
        ))}
      </div>
      {type && (
        <div className="mt-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-brand" />
            <input
              value={q}
              onChange={(ev) => setQ(ev.target.value)}
              placeholder={`Buscar ${ENTITY_TYPE_LABEL[type].toLowerCase()}…`}
              className="w-full rounded-lg border border-brand-border bg-surface py-1.5 pl-8 pr-2 text-sm outline-none focus:border-electric"
            />
          </div>
          <div className="mt-2 max-h-40 space-y-1 overflow-auto">
            {results.length === 0 && (
              <p className="px-2 py-3 text-center text-xs text-muted-brand">
                Sin resultados
              </p>
            )}
            {results.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => onChange(e)}
                className="flex w-full flex-col items-start rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-electric/[0.06]"
              >
                <span className="text-sm font-medium text-ink">{e.label}</span>
                {e.sub && (
                  <span className="text-[11px] text-slate-brand">{e.sub}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TypeChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
        active
          ? "bg-electric text-white"
          : "bg-surface text-ink hover:bg-brand-border-light",
      )}
    >
      {children}
    </button>
  );
}

function DropdownPicker({
  value,
  onChange,
}: {
  value: AttachEntity | null;
  onChange: (e: AttachEntity | null) => void;
}) {
  const type = value?.type ?? "";
  const options = ENTITIES.filter((e) => e.type === type);
  return (
    <div className="grid grid-cols-2 gap-3">
      <select
        value={type}
        onChange={(ev) => {
          const t = ev.target.value;
          onChange(null);
          if (t) {
            const first = ENTITIES.find((e) => e.type === t);
            if (first) onChange(first);
          }
        }}
        className={inputBase}
      >
        <option value="">Sin vínculo</option>
        {ATTACH_TYPES.map((t) => (
          <option key={t} value={t}>
            {ENTITY_TYPE_LABEL[t]}
          </option>
        ))}
      </select>
      <select
        value={value?.id ?? ""}
        disabled={!type}
        onChange={(ev) =>
          onChange(ENTITIES.find((e) => e.id === ev.target.value) ?? null)
        }
        className={cn(inputBase, !type && "opacity-50")}
      >
        {options.map((e) => (
          <option key={e.id} value={e.id}>
            {e.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CommandPicker({
  value,
  onChange,
}: {
  value: AttachEntity | null;
  onChange: (e: AttachEntity | null) => void;
}) {
  const [type, setType] = useState<Exclude<EntityType, "none">>("candidate");
  const [q, setQ] = useState("");

  if (value)
    return <SelectedPill value={value} onClear={() => onChange(null)} />;

  const results = ENTITIES.filter(
    (e) => e.type === type && e.label.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="overflow-hidden rounded-xl border border-brand-border bg-canvas">
      <div className="flex border-b border-brand-border">
        {ATTACH_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              "flex-1 px-2 py-2 text-xs font-semibold transition-colors",
              type === t
                ? "border-b-2 border-electric text-electric"
                : "text-slate-brand hover:text-ink",
            )}
          >
            {ENTITY_TYPE_LABEL[t]}
          </button>
        ))}
      </div>
      <div className="relative border-b border-brand-border">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-brand" />
        <input
          value={q}
          onChange={(ev) => setQ(ev.target.value)}
          placeholder="Escribí para buscar…"
          className="w-full bg-transparent py-2.5 pl-9 pr-3 text-sm outline-none"
        />
      </div>
      <div className="max-h-44 overflow-auto py-1">
        {results.length === 0 && (
          <p className="px-3 py-4 text-center text-xs text-muted-brand">
            Sin resultados
          </p>
        )}
        {results.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => onChange(e)}
            className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-electric/[0.06]"
          >
            <span className="flex flex-col">
              <span className="text-sm font-medium text-ink">{e.label}</span>
              {e.sub && (
                <span className="text-[11px] text-slate-brand">{e.sub}</span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
