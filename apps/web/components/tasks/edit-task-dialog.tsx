"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { TASK_API_KEY, updateTask } from "@/lib/api/tasks";
import { getAllUsers, USERS_API_KEY } from "@/lib/api/user";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
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
import type { TaskWithRelations } from "@workspace/shared/types/task";

import {
  AttachmentPicker,
  attachmentToPayload,
  taskToAttachment,
  type AttachmentValue,
} from "./attachment-picker";
import { newTaskFormSchema, type NewTaskFormSchema } from "./new-task.schema";

interface EditTaskDialogProps {
  task: TaskWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditTaskDialog({ task, isOpen, onClose }: EditTaskDialogProps) {
  const queryClient = useQueryClient();

  const { data: usersData } = useQuery({
    queryKey: [USERS_API_KEY, { limit: 1000, page: 1 }],
    queryFn: () => getAllUsers({ limit: 1000, page: 1 }),
  });
  const users = usersData?.items ?? [];

  const form = useForm<NewTaskFormSchema>({
    resolver: zodResolver(newTaskFormSchema),
    defaultValues: { title: "", dueDate: "", assignedTo: undefined },
  });
  const [attachment, setAttachment] = useState<AttachmentValue>(null);

  useEffect(() => {
    if (!task) return;
    form.reset({
      title: task.title,
      dueDate: task.dueDate ?? "",
      assignedTo: task.assignedTo,
    });
    setAttachment(taskToAttachment(task));
  }, [task, form]);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (values: NewTaskFormSchema) => {
      if (!task) throw new Error("Sin tarea");
      return updateTask(task.id, {
        title: values.title,
        dueDate: values.dueDate ? values.dueDate : null,
        assignedTo: values.assignedTo,
        ...attachmentToPayload(attachment),
      });
    },
    onSuccess: () => {
      toast.success("Tarea actualizada");
      queryClient.invalidateQueries({ queryKey: [TASK_API_KEY] });
      onClose();
    },
    onError: () => toast.error("No se pudo actualizar la tarea"),
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl border-brand-border bg-surface">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-ink">
            Editar tarea
          </DialogTitle>
          <DialogDescription className="text-slate-brand">
            Modifica el título, vencimiento o responsable.
          </DialogDescription>
        </DialogHeader>

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
                    <Input {...field} />
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

            <div className="space-y-1.5">
              <FormLabel>Vínculo (opcional)</FormLabel>
              <AttachmentPicker value={attachment} onChange={setAttachment} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-md text-ink"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-electric hover:bg-electric-light text-white rounded-md px-5 font-semibold"
              >
                {isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
