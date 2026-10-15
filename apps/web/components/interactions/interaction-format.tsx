"use client";

import {
  Coffee,
  Mail,
  MessageSquare,
  Phone,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@workspace/ui/lib/utils";
import { InteractionType } from "@workspace/shared/enums";
import type { LastInteraction } from "@workspace/shared/types/interaction";

import { todayIsoDay } from "@/components/tasks/task-due-dates";

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
