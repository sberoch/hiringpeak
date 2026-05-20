"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getAllNotifications,
  markNotificationRead,
  NOTIFICATION_API_KEY,
} from "@/lib/api/notifications";
import { cn } from "@workspace/ui/lib/utils";
import type { NotificationWithRelations } from "@workspace/shared/types/notification";

import {
  NOTIF_ICON,
  NOTIF_LABEL,
  relativeTime,
  type NotificationKind,
} from "./_shared";

function isKnownKind(kind: string): kind is NotificationKind {
  return kind === "assigned" || kind === "due" || kind === "overdue";
}

export function NotificationsList() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [NOTIFICATION_API_KEY, { order: "createdAt:desc", limit: 100 }],
    queryFn: () =>
      getAllNotifications({ order: "createdAt:desc", limit: 100 }),
    staleTime: 0,
  });

  const items = data?.items ?? [];
  const unread = items.filter((n) => !n.readAt);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [NOTIFICATION_API_KEY] });
  };

  const readMutation = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: invalidate,
    onError: () => toast.error("No se pudo marcar como leída"),
  });

  const markAllRead = async () => {
    try {
      await Promise.all(unread.map((n) => markNotificationRead(n.id)));
      invalidate();
    } catch {
      toast.error("No se pudo marcar todo como leído");
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-border bg-surface">
      <div className="flex items-center justify-between border-b border-brand-border px-4 py-2.5">
        <span className="text-sm font-semibold text-ink">Notificaciones</span>
        <button
          type="button"
          onClick={markAllRead}
          disabled={unread.length === 0}
          className="text-xs font-medium text-electric hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:no-underline"
        >
          Marcar todo como leído
        </button>
      </div>

      {isLoading ? (
        <p className="px-6 py-16 text-center text-sm text-muted-brand">
          Cargando notificaciones…
        </p>
      ) : items.length === 0 ? (
        <p className="px-6 py-16 text-center text-sm text-muted-brand">
          No tenés notificaciones por ahora.
        </p>
      ) : (
        items.map((n, i) => (
          <NotifRow
            key={n.id}
            n={n}
            bordered={i !== 0}
            onClick={() => {
              if (!n.readAt) readMutation.mutate(n.id);
            }}
          />
        ))
      )}
    </div>
  );
}

function NotifRow({
  n,
  bordered,
  onClick,
}: {
  n: NotificationWithRelations;
  bordered: boolean;
  onClick: () => void;
}) {
  const isUnread = !n.readAt;
  const kind: NotificationKind = isKnownKind(n.kind) ? n.kind : "assigned";
  const meta = NOTIF_ICON[kind];
  const Icon = meta.icon;
  const title = n.task?.title ?? `Tarea #${n.taskId}`;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
        bordered && "border-t border-brand-border",
        isUnread ? "bg-electric/[0.04]" : "bg-surface",
      )}
    >
      {isUnread && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-electric" />
      )}
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          meta.bg,
          !isUnread && "opacity-60",
        )}
      >
        <Icon className={cn("h-4 w-4", meta.tone)} />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm",
            isUnread
              ? "font-semibold text-ink"
              : "font-normal text-slate-brand",
          )}
        >
          {NOTIF_LABEL[kind]}
        </p>
        <p className="truncate text-xs text-slate-brand">«{title}»</p>
      </div>
      <span className="shrink-0 text-[11px] text-muted-brand">
        {relativeTime(n.createdAt)}
      </span>
    </button>
  );
}
