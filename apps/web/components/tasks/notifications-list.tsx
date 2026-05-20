"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Check, X } from "lucide-react";
import { toast } from "sonner";

import {
  dismissNotification,
  getAllNotifications,
  markNotificationRead,
  NOTIFICATION_API_KEY,
} from "@/lib/api/notifications";
import { cn } from "@workspace/ui/lib/utils";
import type { NotificationWithRelations } from "@workspace/shared/types/notification";

function formatRelative(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days} d`;
}

function notificationLabel(n: NotificationWithRelations) {
  if (n.kind === "assigned") return "Te asignaron una tarea";
  if (n.kind === "due") return "Tarea próxima a vencer";
  if (n.kind === "overdue") return "Tarea vencida";
  return "Notificación";
}

export function NotificationsList() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [
      NOTIFICATION_API_KEY,
      { order: "createdAt:desc", limit: 100 },
    ],
    queryFn: () =>
      getAllNotifications({ order: "createdAt:desc", limit: 100 }),
    staleTime: 0,
  });

  const items = data?.items ?? [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [NOTIFICATION_API_KEY] });
  };

  const readMutation = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: invalidate,
    onError: () => toast.error("No se pudo marcar como leída"),
  });

  const dismissMutation = useMutation({
    mutationFn: (id: number) => dismissNotification(id),
    onSuccess: invalidate,
    onError: () => toast.error("No se pudo descartar la notificación"),
  });

  if (isLoading) {
    return (
      <p className="text-sm text-slate-brand">Cargando notificaciones...</p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-brand">
        No tenés notificaciones por ahora.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-brand-border">
      {items.map((n) => {
        const unread = !n.readAt;
        return (
          <li
            key={n.id}
            className={cn(
              "flex items-start gap-3 py-3",
              !unread && "opacity-70",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                unread ? "bg-electric/10 text-electric" : "bg-canvas text-slate-brand",
              )}
            >
              <BellRing className="h-3.5 w-3.5" />
            </span>

            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm",
                  unread ? "font-semibold text-ink" : "text-slate-brand",
                )}
              >
                {notificationLabel(n)}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-brand">
                «{n.task?.title ?? `Tarea #${n.taskId}`}»
              </p>
              <p className="mt-0.5 text-[11px] text-muted-brand">
                {formatRelative(n.createdAt)}
              </p>
            </div>

            <div className="ml-2 flex shrink-0 items-center gap-1">
              {unread && (
                <button
                  type="button"
                  onClick={() => readMutation.mutate(n.id)}
                  disabled={readMutation.isPending}
                  aria-label="Marcar como leída"
                  className="rounded-md p-1.5 text-slate-brand hover:bg-canvas hover:text-ink"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => dismissMutation.mutate(n.id)}
                disabled={dismissMutation.isPending}
                aria-label="Descartar notificación"
                className="rounded-md p-1.5 text-slate-brand hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
