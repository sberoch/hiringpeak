"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Check, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import { PermissionCode } from "@workspace/shared/enums";
import {
  defaultFollowUpOwner,
  FOLLOW_UP_PRESET_DAYS,
  followUpDueDate,
  followUpTitle,
} from "@workspace/shared/lib/contact-follow-up";
import type {
  ContactFollowUp,
  NetworkContact,
} from "@workspace/shared/types/contact";
import type { TaskWithRelations } from "@workspace/shared/types/task";

import { usePermissions } from "@/contexts/permission-context";
import { CONTACT_API_KEY } from "@/lib/api/contact";
import {
  completeTask,
  createTask,
  getAllTasks,
  reopenTask,
  TASK_API_KEY,
} from "@/lib/api/tasks";
import { dueTone, formatDue, OwnerAvatar, todayIsoDay } from "../tasks/_shared";
import { TaskSheet } from "../tasks/task-sheet";
import { useCommercialUsers, useCurrentUserId } from "./contact-lookups";

const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

/** "jue 22/10" for a `YYYY-MM-DD` day. */
function dayLabel(isoDay: string) {
  const [y, m, d] = isoDay.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  return `${WEEKDAYS[date.getDay()]} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

const pill = (active: boolean) =>
  cn(
    "rounded-full px-3 py-1 text-xs font-semibold transition-all",
    active
      ? "bg-electric text-white shadow-[0_2px_8px_-2px_rgba(0,102,255,0.4)]"
      : "bg-surface text-ink ring-1 ring-brand-border hover:ring-electric/40",
  );

/**
 * "Abordar en X días": presets 3/7/14/30 or a custom number of days. With
 * `optional`, a "No" pill leaves it empty (`null`).
 */
export function FollowUpDaysPicker({
  value,
  onChange,
  optional,
}: {
  value: number | null;
  onChange: (days: number | null) => void;
  optional?: boolean;
}) {
  const isPreset =
    value != null &&
    (FOLLOW_UP_PRESET_DAYS as readonly number[]).includes(value);
  const [custom, setCustom] = useState(
    value != null && !isPreset ? String(value) : "",
  );
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1.5">
        {optional && (
          <button
            type="button"
            className={pill(value == null)}
            onClick={() => {
              setCustom("");
              onChange(null);
            }}
          >
            No
          </button>
        )}
        {FOLLOW_UP_PRESET_DAYS.map((days) => (
          <button
            key={days}
            type="button"
            className={pill(value === days && !custom)}
            onClick={() => {
              setCustom("");
              onChange(days);
            }}
          >
            {days} días
          </button>
        ))}
        <Input
          value={custom}
          inputMode="numeric"
          aria-label="Otra cantidad de días"
          placeholder="otro"
          className="h-7 w-16 px-2 text-center text-xs"
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "").slice(0, 3);
            setCustom(digits);
            onChange(digits ? Number(digits) : optional ? null : 7);
          }}
        />
      </div>
      {value != null && (
        <p className="text-xs text-slate-brand">
          Vence el{" "}
          <span className="font-semibold text-ink">
            {dayLabel(followUpDueDate(todayIsoDay(), value))}
          </span>
        </p>
      )}
    </div>
  );
}

/** Whether the signed-in user can add follow-ups (Tasks) at all. */
export function useCanAddFollowUp() {
  const { hasPermission } = usePermissions();
  return hasPermission(PermissionCode.TASK_MANAGE);
}

/**
 * "Agregar seguimiento": a follow-up Task attached to the Contact, due today
 * + X. Owned by whoever creates it, even on someone else's Contact; with
 * TASK_MANAGE_ALL it can be handed to another commercial user.
 */
export function FollowUpForm({
  contact,
  onDone,
  onCancel,
}: {
  contact: Pick<NetworkContact, "id" | "name" | "ownerId">;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const me = useCurrentUserId();
  const { hasPermission } = usePermissions();
  const canDelegate = hasPermission(PermissionCode.TASK_MANAGE_ALL);
  const users = useCommercialUsers();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(() => followUpTitle(contact.name));
  const [days, setDays] = useState<number | null>(7);
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const owner =
    ownerId ??
    (me != null
      ? defaultFollowUpOwner("added", {
          creatorId: me,
          contactOwnerId: contact.ownerId,
        })
      : null);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      createTask({
        title: title.trim(),
        dueDate: followUpDueDate(todayIsoDay(), days ?? 7),
        assignedTo: owner!,
        contactIds: [contact.id],
      }),
    onSuccess: (task) => {
      toast.success("Seguimiento creado", {
        description: `${task.title} · ${task.dueDate ? dayLabel(task.dueDate) : "sin fecha"}`,
      });
      void queryClient.invalidateQueries({ queryKey: [TASK_API_KEY] });
      void queryClient.invalidateQueries({ queryKey: [CONTACT_API_KEY] });
      onDone?.();
    },
    onError: () => toast.error("No se pudo crear el seguimiento."),
  });

  const submit = () => {
    if (!title.trim() || owner == null || isPending) return;
    mutate();
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-slate-brand">Qué hay que hacer</Label>
        <Input
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && submit()}
          className="h-9 text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-slate-brand">Abordar en</Label>
        <FollowUpDaysPicker value={days} onChange={setDays} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-slate-brand">Responsable</Label>
        {canDelegate ? (
          <Select
            value={owner != null ? String(owner) : ""}
            onValueChange={(value) => setOwnerId(Number(value))}
          >
            <SelectTrigger className="h-9 w-full text-sm">
              <SelectValue placeholder="Elegí un responsable" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={String(user.id)}>
                  {user.name}
                  {user.id === me ? " (vos)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-ink">Vos</p>
        )}
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button
          size="sm"
          variant="brand"
          disabled={!title.trim() || owner == null || isPending}
          onClick={submit}
        >
          <CalendarPlus className="h-4 w-4" />
          {isPending ? "Creando..." : "Crear seguimiento"}
        </Button>
      </div>
    </div>
  );
}

/** "Agregar seguimiento" from the Contactos row menu. */
export function AddFollowUpDialog({
  contact,
  open,
  onOpenChange,
}: {
  contact: Pick<NetworkContact, "id" | "name" | "ownerId">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar seguimiento</DialogTitle>
          <DialogDescription>
            Tarea vinculada a {contact.name}.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <FollowUpForm
            contact={contact}
            onDone={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** "Próximo seguimiento": the title, with the due date on a second line. */
export function NextFollowUpCell({
  followUp,
}: {
  followUp: ContactFollowUp | null;
}) {
  const today = useMemo(() => todayIsoDay(), []);
  if (!followUp) return <span className="text-muted-brand">—</span>;
  const task = { dueDate: followUp.dueDate, completed: false };
  return (
    <div className="flex min-w-0 max-w-[200px] flex-col">
      <span className="truncate text-ink" title={followUp.title}>
        {followUp.title}
      </span>
      <span className={cn("text-xs font-semibold", dueTone(task, today))}>
        {formatDue(task, today)}
      </span>
    </div>
  );
}

/** Seguimientos tab on the Contact page: every Task attached to the Contact. */
export function ContactFollowUpsTab({ contact }: { contact: NetworkContact }) {
  const me = useCurrentUserId();
  const canAdd = useCanAddFollowUp();
  const { hasPermission } = usePermissions();
  const canManageAll = hasPermission(PermissionCode.TASK_MANAGE_ALL);
  const queryClient = useQueryClient();
  const today = useMemo(() => todayIsoDay(), []);
  const [filter, setFilter] = useState<"open" | "done">("open");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<TaskWithRelations | null>(null);

  const params = { contactId: contact.id, order: "dueDate:asc", limit: 200 };
  const { data, isLoading } = useQuery({
    queryKey: [TASK_API_KEY, params],
    queryFn: () => getAllTasks(params),
  });
  const all = data?.items ?? [];
  const open = sortByDue(all.filter((task) => !task.completed));
  const done = all.filter((task) => task.completed);
  const list = filter === "open" ? open : done;

  const { mutate: toggle } = useMutation({
    mutationFn: (task: TaskWithRelations) =>
      task.completed ? reopenTask(task.id) : completeTask(task.id),
    onSuccess: (task) => {
      toast.success(
        task.completed ? "Seguimiento hecho" : "Seguimiento reabierto",
      );
      void queryClient.invalidateQueries({ queryKey: [TASK_API_KEY] });
      void queryClient.invalidateQueries({ queryKey: [CONTACT_API_KEY] });
    },
    onError: () => toast.error("No se pudo actualizar el seguimiento."),
  });

  const firstName = contact.name.trim().split(/\s+/)[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={pill(filter === "open")}
            onClick={() => setFilter("open")}
          >
            Pendientes {open.length}
          </button>
          <button
            type="button"
            className={pill(filter === "done")}
            onClick={() => setFilter("done")}
          >
            Hechos {done.length}
          </button>
        </div>
        {canAdd && (
          <Button
            size="sm"
            className="bg-electric text-white hover:bg-electric-light"
            onClick={() => setAdding((current) => !current)}
          >
            <Plus className="h-4 w-4" />
            Nuevo seguimiento
          </Button>
        )}
      </div>

      {adding && (
        <div className="max-w-xl rounded-2xl border border-electric/25 bg-electric/[0.03] p-4">
          <FollowUpForm
            contact={contact}
            onDone={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-brand-border bg-surface">
        {isLoading ? (
          <p className="px-5 py-8 text-center text-sm text-muted-brand">
            Cargando seguimientos…
          </p>
        ) : list.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-brand">
            {filter === "open"
              ? `Nada pendiente con ${firstName}.`
              : "Ninguno hecho todavía."}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-xs font-semibold text-slate-brand">
                <th className="w-12 px-5 py-3" />
                <th className="px-3 py-3">Seguimiento</th>
                <th className="w-[160px] px-3 py-3">Vence</th>
                <th className="w-[200px] px-5 py-3">Responsable</th>
              </tr>
            </thead>
            <tbody>
              {list.map((task) => {
                const canManage = canManageAll || task.assignedTo === me;
                const owner = task.assignedToUser;
                return (
                  <tr
                    key={task.id}
                    className="border-b border-brand-border-light last:border-0 hover:bg-canvas/60"
                  >
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        disabled={!canManage}
                        onClick={() => toggle(task)}
                        title={
                          task.completed ? "Marcar pendiente" : "Marcar hecho"
                        }
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-md border transition-colors",
                          task.completed
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-brand-border hover:border-electric",
                          !canManage && "cursor-not-allowed opacity-60",
                        )}
                      >
                        {task.completed && <Check className="h-3 w-3" />}
                      </button>
                    </td>
                    <td className="px-3 py-4">
                      <button
                        type="button"
                        disabled={!canManage}
                        onClick={() => setEditing(task)}
                        className={cn(
                          "text-left text-ink",
                          canManage && "hover:text-electric",
                          task.completed && "text-muted-brand line-through",
                        )}
                      >
                        {task.title}
                      </button>
                    </td>
                    <td
                      className={cn(
                        "px-3 py-4 text-sm font-semibold",
                        task.completed
                          ? "text-muted-brand"
                          : dueTone(task, today),
                      )}
                    >
                      {formatDue(task, today)}
                    </td>
                    <td className="px-5 py-4">
                      {owner && (
                        <span className="inline-flex items-center gap-2 text-slate-brand">
                          <OwnerAvatar
                            name={owner.name}
                            isMe={owner.id === me}
                            size="sm"
                          />
                          {owner.id === me ? "Vos" : owner.name}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <TaskSheet
        open={editing != null}
        onOpenChange={(next) => !next && setEditing(null)}
        task={editing}
      />
    </div>
  );
}

/** Due first, undated last. */
function sortByDue(tasks: TaskWithRelations[]) {
  return [...tasks].sort((a, b) =>
    (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"),
  );
}
