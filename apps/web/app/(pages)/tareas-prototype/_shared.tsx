"use client";

/**
 * THROWAWAY PROTOTYPE — small presentational atoms shared across variants
 * (like a shared <Header>). Layout/structure is intentionally NOT shared:
 * each variant owns its own composition.
 */

import {
  Bell,
  Building2,
  Clock,
  GitBranch,
  Slash,
  User,
  UserPlus,
  AlertTriangle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@workspace/ui/lib/utils";

import {
  type AttachEntity,
  type EntityType,
  type NotificationKind,
  ENTITY_TYPE_LABEL,
  initials,
  userName,
} from "./_mock-data";

export const ENTITY_ICON: Record<Exclude<EntityType, "none">, LucideIcon> = {
  candidate: User,
  vacancy: GitBranch,
  candidacy: GitBranch,
  company: Building2,
};

/** Chip showing what a task is attached to (or that it is standalone). */
export function AttachChip({
  attach,
  className,
}: {
  attach: AttachEntity | null;
  className?: string;
}) {
  if (!attach) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-dashed border-brand-border px-1.5 py-0.5 text-[11px] text-muted-brand",
          className,
        )}
      >
        <Slash className="h-3 w-3" />
        Sin vincular
      </span>
    );
  }
  const Icon = ENTITY_ICON[attach.type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-electric/5 px-1.5 py-0.5 text-[11px] font-medium text-electric",
        className,
      )}
      title={`${ENTITY_TYPE_LABEL[attach.type]}: ${attach.label}`}
    >
      <Icon className="h-3 w-3" />
      {attach.label}
    </span>
  );
}

/** Round owner avatar with initials; ring when it's the current user. */
export function OwnerAvatar({
  ownerId,
  size = "md",
}: {
  ownerId: string;
  size?: "sm" | "md";
}) {
  const name = userName(ownerId);
  const isMe = name === "María González";
  return (
    <span
      title={`Responsable: ${name}${isMe ? " (vos)" : ""}`}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-electric/10 font-semibold text-electric",
        size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs",
        isMe && "ring-2 ring-electric/30",
      )}
    >
      {initials(name)}
    </span>
  );
}

export const NOTIF_ICON: Record<
  NotificationKind,
  { icon: LucideIcon; tone: string; bg: string }
> = {
  assigned: { icon: UserPlus, tone: "text-electric", bg: "bg-electric/10" },
  due: { icon: Clock, tone: "text-amber-600", bg: "bg-amber-50" },
  overdue: { icon: AlertTriangle, tone: "text-red-600", bg: "bg-red-50" },
};

export function BellButton({
  unread,
  onClick,
  active,
}: {
  unread: number;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Notificaciones"
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-surface text-ink transition-all hover:border-electric/30 hover:shadow-[0_2px_8px_-2px_rgba(0,102,255,0.15)]",
        active && "border-electric/40 bg-electric/[0.06]",
      )}
    >
      <Bell className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {unread}
        </span>
      )}
    </button>
  );
}

/** Compact "resumen" of the due situation — the dashboard widget, inline. */
export function DueSummaryStrip({
  overdue,
  today,
  week,
  className,
}: {
  overdue: number;
  today: number;
  week: number;
  className?: string;
}) {
  const items = [
    { label: "Vencidas", value: overdue, tone: "text-red-600" },
    { label: "Vence hoy", value: today, tone: "text-amber-600" },
    { label: "Esta semana", value: week, tone: "text-ink" },
  ];
  return (
    <div
      className={cn(
        "flex items-center divide-x divide-brand-border rounded-xl border border-brand-border bg-surface",
        className,
      )}
    >
      {items.map((it) => (
        <div key={it.label} className="flex flex-1 flex-col items-center px-4 py-3">
          <span className={cn("text-xl font-bold tracking-tight", it.tone)}>
            {it.value}
          </span>
          <span className="text-[11px] text-slate-brand">{it.label}</span>
        </div>
      ))}
    </div>
  );
}
