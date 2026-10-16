"use client";

import { ChevronDown, ChevronRight } from "lucide-react";

import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import { InteractionType } from "@workspace/shared/enums";
import type { Interaction } from "@workspace/shared/types/interaction";

import { todayIsoDay } from "@/components/tasks/task-due-dates";
import { INTERACTION_TYPES } from "@/components/interactions/interaction-format";

export type InteractionDraft = {
  type: InteractionType;
  date: string;
  summary: string;
};

export function emptyInteractionDraft(): InteractionDraft {
  return { type: InteractionType.CALL, date: todayIsoDay(), summary: "" };
}

/** Why the draft can't be saved yet, or null. */
export function interactionDraftProblem(draft: InteractionDraft) {
  if (!draft.summary.trim()) return "Escribí un resumen";
  if (draft.date > todayIsoDay())
    return "Una interacción es algo que ya pasó: la fecha no puede ser futura. Para algo por hacer, creá una tarea.";
  return null;
}

export function InteractionFields({
  value,
  onChange,
  autoFocus,
  placeholder = "¿Qué pasó? Ej. «Valeria pidió bajar el fee; respondemos el viernes.»",
}: {
  value: InteractionDraft;
  onChange: (draft: InteractionDraft) => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const today = todayIsoDay();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {INTERACTION_TYPES.map((t) => {
          const Icon = t.icon;
          const active = value.type === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onChange({ ...value, type: t.key })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 transition-colors",
                active
                  ? "bg-electric text-white ring-electric"
                  : "bg-surface text-slate-brand ring-brand-border hover:text-ink",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1.5">
          <Label className="text-xs text-slate-brand">Fecha</Label>
          <Input
            type="date"
            value={value.date}
            max={today}
            onChange={(e) =>
              onChange({ ...value, date: e.target.value || today })
            }
            className="h-8 w-[150px] text-xs"
          />
        </div>
      </div>
      {value.date > today && (
        <p className="text-xs text-red-600">
          Una interacción es algo que ya pasó: la fecha no puede ser futura.
          Para algo por hacer, creá una tarea.
        </p>
      )}
      <Textarea
        autoFocus={autoFocus}
        value={value.summary}
        onChange={(e) => onChange({ ...value, summary: e.target.value })}
        rows={3}
        placeholder={placeholder}
        className="resize-none bg-surface"
      />
    </div>
  );
}

// ── Quick capture ──

export type MeetDraft = InteractionDraft & { open: boolean };

export function emptyMeetDraft(): MeetDraft {
  return { ...emptyInteractionDraft(), open: false };
}

/** "Nos conocimos en…": optional first Interaction, collapsed by default. */
export function MeetSection({
  value,
  onChange,
}: {
  value: MeetDraft;
  onChange: (draft: MeetDraft) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-brand-border",
        value.open ? "bg-canvas/60" : "bg-surface",
      )}
    >
      <button
        type="button"
        onClick={() => onChange({ ...value, open: !value.open })}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-ink"
      >
        {value.open ? (
          <ChevronDown className="h-4 w-4 text-slate-brand" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-brand" />
        )}
        Nos conocimos en…
        {!value.open && (
          <span className="text-xs font-normal text-muted-brand">
            Primera interacción (opcional)
          </span>
        )}
      </button>
      {value.open && (
        <div className="px-3 pb-3">
          <InteractionFields
            value={value}
            onChange={(draft) => onChange({ ...value, ...draft })}
            placeholder="Ej. Almuerzo de AmCham. Está evaluando propuestas; hablar en dos semanas."
          />
        </div>
      )}
    </div>
  );
}

// ── Who it was with ──
