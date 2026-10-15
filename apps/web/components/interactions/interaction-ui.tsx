"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  Coffee,
  Mail,
  MessageSquare,
  Phone,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import { InteractionType } from "@workspace/shared/enums";
import type {
  CreateInteractionPayload,
  Interaction,
  LastInteraction,
} from "@workspace/shared/types/interaction";

import { apiErrorMessage } from "@/components/opportunities/opportunity-ui";
import { todayIsoDay } from "@/components/tasks/_shared";
import { COMPANIES_API_KEY } from "@/lib/api/company";
import { CONTACT_API_KEY, getContacts } from "@/lib/api/contact";
import {
  createInteraction,
  deleteInteraction,
  INTERACTION_API_KEY,
} from "@/lib/api/interaction";
import { OPPORTUNITY_API_KEY } from "@/lib/api/opportunity";

export const INTERACTION_TYPES: {
  key: InteractionType;
  label: string;
  icon: LucideIcon;
}[] = [
  { key: InteractionType.CALL, label: "Llamada", icon: Phone },
  { key: InteractionType.MEETING, label: "Reunión", icon: Users },
  { key: InteractionType.EMAIL, label: "Email", icon: Mail },
  { key: InteractionType.LUNCH, label: "Almuerzo", icon: Coffee },
  { key: InteractionType.OTHER, label: "Otro", icon: MessageSquare },
];

export function interactionMeta(type: InteractionType) {
  return INTERACTION_TYPES.find((t) => t.key === type) ?? INTERACTION_TYPES[4]!;
}

const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function parseDay(isoDay: string): Date {
  const [y, m, d] = isoDay.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

/** `YYYY-MM-DD` → "15 oct 2026". */
export function formatInteractionDay(isoDay: string): string {
  const d = parseDay(isoDay);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "hoy", "ayer", "hace 12 días", "hace 3 meses". */
export function sinceLabel(isoDay: string): string {
  const days = Math.round(
    (parseDay(todayIsoDay()).getTime() - parseDay(isoDay).getTime()) / 86400000,
  );
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 60) return `hace ${days} días`;
  return `hace ${Math.floor(days / 30)} meses`;
}

/** The "Última interacción" cell of the Opportunities and Contactos lists. */
export function LastInteractionLabel({
  last,
  className,
}: {
  last: LastInteraction | null;
  className?: string;
}) {
  if (!last) {
    return <span className={cn("text-muted-brand", className)}>Nunca</span>;
  }
  const meta = interactionMeta(last.type);
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-slate-brand",
        className,
      )}
      title={`${meta.label} · ${formatInteractionDay(last.date)}`}
    >
      <Icon className="h-4 w-4 text-muted-brand" />
      {sinceLabel(last.date)}
    </span>
  );
}

// ── What happened: type, date, summary ──

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

export type ContactOption = { id: number; name: string; hint?: string };

export function ContactChips({
  options,
  selected,
  onToggle,
  empty = "La empresa no tiene contactos cargados.",
}: {
  options: ContactOption[];
  selected: number[];
  onToggle: (id: number) => void;
  empty?: string;
}) {
  if (options.length === 0) {
    return <span className="text-xs text-muted-brand">{empty}</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((c) => {
        const on = selected.includes(c.id);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onToggle(c.id)}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 transition-colors",
              on
                ? "bg-electric/10 text-electric ring-electric/30"
                : "text-slate-brand ring-brand-border hover:text-ink",
            )}
          >
            {c.name}
            {c.hint && (
              <span
                className={cn(
                  "ml-1",
                  on ? "text-electric/70" : "text-muted-brand",
                )}
              >
                · {c.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

const ALL_CONTACTS = { limit: 1e9, page: 1, order: "name:asc" } as const;

/** The whole network, for "someone from another Company or without one". */
export function useNetworkContacts(enabled = true) {
  const { data } = useQuery({
    queryKey: [CONTACT_API_KEY, ALL_CONTACTS],
    queryFn: () => getContacts(ALL_CONTACTS),
    enabled,
  });
  return data?.items ?? [];
}

/** A Company's current Contacts. */
export function useCompanyContacts(companyId: number | null) {
  const params = { ...ALL_CONTACTS, company: companyId ?? undefined };
  const { data } = useQuery({
    queryKey: [CONTACT_API_KEY, params],
    queryFn: () => getContacts(params),
    enabled: companyId != null,
  });
  return companyId == null ? [] : (data?.items ?? []);
}

/** Select to add anyone from the network not already listed. */
export function NetworkContactAdder({
  excludeIds,
  onAdd,
  placeholder = "Agregar a alguien de otra empresa o sin empresa…",
}: {
  excludeIds: number[];
  onAdd: (contact: ContactOption) => void;
  placeholder?: string;
}) {
  const network = useNetworkContacts();
  const options = network.filter((c) => !excludeIds.includes(c.id));
  if (options.length === 0) return null;
  return (
    <Select
      value=""
      onValueChange={(value) => {
        const contact = options.find((c) => c.id === Number(value));
        if (contact) {
          onAdd({
            id: contact.id,
            name: contact.name,
            hint: contact.company?.name ?? "Sin empresa",
          });
        }
      }}
    >
      <SelectTrigger className="h-8 w-full text-xs text-slate-brand">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((c) => (
          <SelectItem key={c.id} value={String(c.id)}>
            {c.name} · {c.company?.name ?? "Sin empresa"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ── Writes ──

function useInvalidateInteractions() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: [INTERACTION_API_KEY] });
    void queryClient.invalidateQueries({ queryKey: [CONTACT_API_KEY] });
    void queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_API_KEY] });
    void queryClient.invalidateQueries({ queryKey: [COMPANIES_API_KEY] });
  };
}

export function useCreateInteraction(onDone?: (created: Interaction) => void) {
  const invalidate = useInvalidateInteractions();
  return useMutation({
    mutationFn: (payload: CreateInteractionPayload) =>
      createInteraction(payload),
    onSuccess: (created) => {
      invalidate();
      toast.success("Interacción registrada", {
        description: [
          created.date < todayIsoDay()
            ? `Fechada el ${formatInteractionDay(created.date)}`
            : null,
          created.company?.name ?? "Sin empresa",
        ]
          .filter(Boolean)
          .join(" · "),
      });
      onDone?.(created);
    },
    onError: (err) =>
      toast.error(apiErrorMessage(err, "No se pudo registrar la interacción.")),
  });
}

function useDeleteInteraction() {
  const invalidate = useInvalidateInteractions();
  return useMutation({
    mutationFn: (id: number) => deleteInteraction(id),
    onSuccess: () => {
      invalidate();
      toast.success("Interacción eliminada");
    },
    onError: (err) =>
      toast.error(apiErrorMessage(err, "No se pudo eliminar la interacción.")),
  });
}

// ── Reading ──

/**
 * One Interaction: type, when, who recorded it, the summary, the Contacts
 * (people who have since moved show where they are today, as a hint) and the
 * Opportunity it was tied to.
 */
export function InteractionEntry({
  interaction,
  canManage,
  showOpportunity = true,
  showCompany = false,
  className,
}: {
  interaction: Interaction;
  canManage: boolean;
  showOpportunity?: boolean;
  showCompany?: boolean;
  className?: string;
}) {
  const remove = useDeleteInteraction();
  const meta = interactionMeta(interaction.type);
  const Icon = meta.icon;
  const by = interaction.createdByUser?.name.split(" ")[0];
  return (
    <div className={cn("group flex gap-3", className)}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-electric/10 text-electric">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <span className="font-semibold text-ink">{meta.label}</span>
          <span
            className="text-slate-brand"
            title={sinceLabel(interaction.date)}
          >
            {formatInteractionDay(interaction.date)}
          </span>
          {showCompany && (
            <span className="text-muted-brand">
              · {interaction.company?.name ?? "Sin empresa"}
            </span>
          )}
          {by && <span className="text-muted-brand">· registró {by}</span>}
          {canManage && (
            <button
              type="button"
              aria-label="Eliminar interacción"
              className="ml-auto text-muted-brand opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm("¿Eliminar esta interacción?")) {
                  remove.mutate(interaction.id);
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">
          {interaction.summary}
        </p>
        {(interaction.contacts.length > 0 ||
          (showOpportunity && interaction.opportunity)) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {interaction.contacts.map((c) => {
              // People who moved still show here; where they are today is a hint, not a rewrite.
              const movedTo =
                c.companyId !== interaction.companyId
                  ? (c.company?.name ?? "sin empresa")
                  : null;
              return (
                <Link
                  key={c.id}
                  href={`/contacts/${c.id}`}
                  title={movedTo ? `${c.name} · hoy en ${movedTo}` : c.role}
                  className="rounded-md bg-brand-border-light px-1.5 py-0.5 text-[11px] font-medium text-slate-brand hover:text-electric"
                >
                  {c.name}
                  {movedTo && (
                    <span className="font-normal text-muted-brand">
                      {" "}
                      · hoy en {movedTo}
                    </span>
                  )}
                </Link>
              );
            })}
            {showOpportunity && interaction.opportunity && (
              <Link
                href={`/opportunities/${interaction.opportunity.id}`}
                className="text-[11px] font-medium text-electric hover:underline"
              >
                ↳ {interaction.opportunity.title}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
