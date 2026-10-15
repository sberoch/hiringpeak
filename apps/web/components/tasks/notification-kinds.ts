import { AlertTriangle, Clock, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NotificationKind = "assigned" | "due" | "overdue";

export const NOTIF_LABEL: Record<NotificationKind, string> = {
  assigned: "Te asignaron una tarea",
  due: "Una tarea vence hoy",
  overdue: "Una tarea está vencida",
};

export const NOTIF_ICON: Record<
  NotificationKind,
  { icon: LucideIcon; tone: string; bg: string }
> = {
  assigned: { icon: UserPlus, tone: "text-electric", bg: "bg-electric/10" },
  due: { icon: Clock, tone: "text-amber-600", bg: "bg-amber-50" },
  overdue: { icon: AlertTriangle, tone: "text-red-600", bg: "bg-red-50" },
};
