"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { usePermissions } from "@/contexts/permission-context";
import {
  createTask,
  deleteTask,
  TASK_API_KEY,
  updateTask,
} from "@/lib/api/tasks";
import {
  COMMERCIAL_USERS_API_KEY,
  getCommercialUsers,
  OPPORTUNITY_API_KEY,
} from "@/lib/api/opportunity";
import { getAllUsers, USERS_API_KEY } from "@/lib/api/user";
import { PermissionCode } from "@workspace/shared/enums";
import { hasCommercialAccess } from "@workspace/shared/lib/commercial-access";
import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import type { TaskWithRelations } from "@workspace/shared/types/task";

import { AttachmentPicker } from "./attachment-picker";
import {
  attachmentsToPayload,
  isCommercialAttachments,
  taskAttachments,
  type Attachment,
} from "./attachments";
import { newTaskFormSchema, type NewTaskFormSchema } from "./new-task.schema";

interface TaskSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the Sheet is in edit mode for this task. */
  task?: TaskWithRelations | null;
  /** Create mode starts attached to this record (e.g. the page it's opened from). */
  initialAttachment?: Attachment;
}

export function TaskSheet({
  open,
  onOpenChange,
  task,
  initialAttachment,
}: TaskSheetProps) {
  const isEdit = !!task;
  const queryClient = useQueryClient();
  const session = useSession();
  const { hasPermission, permissionCodes } = usePermissions();
  const canManageAll = hasPermission(PermissionCode.TASK_MANAGE_ALL);
  const actorIsCommercial = hasCommercialAccess(permissionCodes);
  const currentUserId =
    session.status === "authenticated" && session.data?.userId
      ? parseInt(session.data.userId, 10)
      : null;

  const { data: usersData } = useQuery({
    queryKey: [USERS_API_KEY, { limit: 1000, page: 1 }],
    queryFn: () => getAllUsers({ limit: 1000, page: 1 }),
  });
  const users = usersData?.items ?? [];

  // Only Users with commercial access can own a commercial Task.
  const { data: commercialUsers } = useQuery({
    queryKey: [COMMERCIAL_USERS_API_KEY],
    queryFn: getCommercialUsers,
    enabled: canManageAll && actorIsCommercial,
  });
  const commercialUserIds = new Set((commercialUsers ?? []).map((u) => u.id));

  const form = useForm<NewTaskFormSchema>({
    resolver: zodResolver(newTaskFormSchema),
    defaultValues: { title: "", dueDate: "" },
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const isCommercial = isCommercialAttachments(
    attachments,
    task?.stayedCommercial ?? false,
  );

  useEffect(() => {
    if (!open) return;
    if (isEdit && task) {
      form.reset({
        title: task.title,
        dueDate: task.dueDate ?? "",
        assignedTo: task.assignedTo,
      });
      setAttachments(taskAttachments(task));
      return;
    }
    form.reset({ title: "", dueDate: "" });
    setAttachments(initialAttachment ? [initialAttachment] : []);
    if (session.status === "authenticated" && session.data?.userId) {
      form.setValue("assignedTo", parseInt(session.data.userId, 10));
    }
  }, [
    open,
    isEdit,
    task,
    initialAttachment,
    session.status,
    session.data?.userId,
    form,
  ]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: () => {
      toast.success("Tarea eliminada");
      queryClient.invalidateQueries({ queryKey: [TASK_API_KEY] });
      // An Opportunity's next step is derived from its open Tasks.
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_API_KEY] });
      onOpenChange(false);
    },
    onError: () => toast.error("No se pudo eliminar la tarea"),
  });
  const onDelete = () => {
    if (!task) return;
    const ok = window.confirm(
      `¿Eliminar la tarea «${task.title}»? Esta acción es permanente.`,
    );
    if (ok) deleteMutation.mutate(task.id);
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (values: NewTaskFormSchema) => {
      const attachPayload = attachmentsToPayload(attachments);
      if (isEdit && task) {
        return updateTask(task.id, {
          title: values.title,
          dueDate: values.dueDate ? values.dueDate : null,
          assignedTo: canManageAll
            ? values.assignedTo
            : (currentUserId ?? values.assignedTo),
          ...attachPayload,
        });
      }
      return createTask({
        title: values.title,
        dueDate: values.dueDate ? values.dueDate : null,
        assignedTo: canManageAll
          ? values.assignedTo
          : (currentUserId ?? values.assignedTo),
        ...attachPayload,
      });
    },
    onSuccess: () => {
      toast.success(isEdit ? "Tarea actualizada" : "Tarea creada");
      queryClient.invalidateQueries({ queryKey: [TASK_API_KEY] });
      // An Opportunity's next step is derived from its open Tasks.
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_API_KEY] });
      onOpenChange(false);
    },
    onError: (err) =>
      toast.error(
        isEdit ? "No se pudo actualizar la tarea" : "No se pudo crear la tarea",
        { description: apiErrorMessage(err) },
      ),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[90%] overflow-y-auto bg-surface sm:w-auto sm:max-w-md border-brand-border">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold text-ink">
            {isEdit ? "Editar tarea" : "Nueva tarea"}
          </SheetTitle>
          <SheetDescription className="text-slate-brand">
            {isEdit
              ? "Modificá los datos de la tarea."
              : "Creá una tarea y asignala a quien corresponda."}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 py-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((v) => mutateAsync(v))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Llamar al abogado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vencimiento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsable</FormLabel>
                      <FormControl>
                        {canManageAll ? (
                          <Select
                            value={field.value ? String(field.value) : ""}
                            onValueChange={(v) =>
                              field.onChange(v ? Number(v) : undefined)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un responsable" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map((u) => {
                                const blocked =
                                  isCommercial && !commercialUserIds.has(u.id);
                                return (
                                  <SelectItem
                                    key={u.id}
                                    value={String(u.id)}
                                    disabled={blocked}
                                  >
                                    {u.name}
                                    {blocked && (
                                      <span className="text-xs text-muted-brand">
                                        Sin acceso comercial
                                      </span>
                                    )}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            readOnly
                            value={
                              users.find((u) => u.id === field.value)?.name ??
                              "Yo"
                            }
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel>
                    Vínculos{" "}
                    <span className="font-normal text-muted-brand">
                      (opcional)
                    </span>
                  </FormLabel>
                  {attachments.length > 0 && (
                    <span className="text-[11px] text-muted-brand">
                      {attachments.length} vinculados
                    </span>
                  )}
                </div>
                <AttachmentPicker
                  value={attachments}
                  onChange={setAttachments}
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                {isEdit ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onDelete}
                    disabled={deleteMutation.isPending}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="rounded-md text-ink"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-electric hover:bg-electric-light text-white rounded-md px-5 font-semibold"
                  >
                    {isPending
                      ? "Guardando..."
                      : isEdit
                        ? "Guardar"
                        : "Crear tarea"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** The API's message for a rejected write (e.g. an owner without commercial access). */
function apiErrorMessage(err: unknown): string | undefined {
  const message = (err as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;
  return typeof message === "string" ? message : undefined;
}
