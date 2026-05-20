"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  createTask,
  deleteTask,
  TASK_API_KEY,
  updateTask,
} from "@/lib/api/tasks";
import { getAllUsers, USERS_API_KEY } from "@/lib/api/user";
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

import {
  AttachmentPicker,
  attachmentToPayload,
  taskToAttachment,
  type AttachmentValue,
} from "./attachment-picker";
import {
  newTaskFormSchema,
  type NewTaskFormSchema,
} from "./new-task.schema";

interface TaskSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the Sheet is in edit mode for this task. */
  task?: TaskWithRelations | null;
  /** When provided, create-mode locks the attachment to this value. */
  lockedAttachment?: NonNullable<AttachmentValue>;
}

export function TaskSheet({
  open,
  onOpenChange,
  task,
  lockedAttachment,
}: TaskSheetProps) {
  const isEdit = !!task;
  const queryClient = useQueryClient();
  const session = useSession();

  const { data: usersData } = useQuery({
    queryKey: [USERS_API_KEY, { limit: 1000, page: 1 }],
    queryFn: () => getAllUsers({ limit: 1000, page: 1 }),
  });
  const users = usersData?.items ?? [];

  const form = useForm<NewTaskFormSchema>({
    resolver: zodResolver(newTaskFormSchema),
    defaultValues: { title: "", dueDate: "" },
  });
  const [attachment, setAttachment] = useState<AttachmentValue>(
    lockedAttachment ?? null,
  );

  useEffect(() => {
    if (!open) return;
    if (isEdit && task) {
      form.reset({
        title: task.title,
        dueDate: task.dueDate ?? "",
        assignedTo: task.assignedTo,
      });
      setAttachment(taskToAttachment(task));
      return;
    }
    form.reset({ title: "", dueDate: "" });
    setAttachment(lockedAttachment ?? null);
    if (session.status === "authenticated" && session.data?.userId) {
      form.setValue("assignedTo", parseInt(session.data.userId, 10));
    }
  }, [
    open,
    isEdit,
    task,
    lockedAttachment,
    session.status,
    session.data?.userId,
    form,
  ]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: () => {
      toast.success("Tarea eliminada");
      queryClient.invalidateQueries({ queryKey: [TASK_API_KEY] });
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
      const attachPayload = attachmentToPayload(
        lockedAttachment ?? attachment,
      );
      if (isEdit && task) {
        return updateTask(task.id, {
          title: values.title,
          dueDate: values.dueDate ? values.dueDate : null,
          assignedTo: values.assignedTo,
          ...attachPayload,
        });
      }
      return createTask({
        title: values.title,
        dueDate: values.dueDate ? values.dueDate : null,
        assignedTo: values.assignedTo,
        ...attachPayload,
      });
    },
    onSuccess: () => {
      toast.success(isEdit ? "Tarea actualizada" : "Tarea creada");
      queryClient.invalidateQueries({ queryKey: [TASK_API_KEY] });
      onOpenChange(false);
    },
    onError: () =>
      toast.error(
        isEdit ? "No se pudo actualizar la tarea" : "No se pudo crear la tarea",
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
                      <Input
                        placeholder="Ej. Llamar al abogado"
                        {...field}
                      />
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
                            {users.map((u) => (
                              <SelectItem key={u.id} value={String(u.id)}>
                                {u.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!lockedAttachment && (
                <div className="space-y-1.5">
                  <FormLabel>Vínculo (opcional)</FormLabel>
                  <AttachmentPicker
                    value={attachment}
                    onChange={setAttachment}
                  />
                </div>
              )}

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
