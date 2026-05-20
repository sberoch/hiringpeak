"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createTask, TASK_API_KEY } from "@/lib/api/tasks";
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
  AttachmentPicker,
  attachmentToPayload,
  type AttachmentValue,
} from "./attachment-picker";
import {
  newTaskFormSchema,
  type NewTaskFormSchema,
} from "./new-task.schema";

interface NewTaskFormProps {
  onSubmit?: () => void;
}

export function NewTaskForm({ onSubmit }: NewTaskFormProps) {
  const session = useSession();
  const queryClient = useQueryClient();

  const { data: usersData } = useQuery({
    queryKey: [USERS_API_KEY, { limit: 1000, page: 1 }],
    queryFn: () => getAllUsers({ limit: 1000, page: 1 }),
  });
  const users = usersData?.items ?? [];

  const form = useForm<NewTaskFormSchema>({
    resolver: zodResolver(newTaskFormSchema),
    defaultValues: { title: "", dueDate: "" },
  });
  const [attachment, setAttachment] = useState<AttachmentValue>(null);

  useEffect(() => {
    if (session.status !== "authenticated") return;
    if (!session.data?.userId) return;
    if (form.getValues("assignedTo")) return;
    form.setValue("assignedTo", parseInt(session.data.userId, 10));
  }, [session.status, session.data?.userId, form]);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: NewTaskFormSchema) =>
      createTask({
        title: values.title,
        dueDate: values.dueDate ? values.dueDate : null,
        assignedTo: values.assignedTo,
        ...attachmentToPayload(attachment),
      }),
    onSuccess: () => {
      toast.success("Tarea creada");
      queryClient
        .invalidateQueries({ queryKey: [TASK_API_KEY] })
        .then(() => onSubmit?.());
      form.reset({ title: "", dueDate: "", assignedTo: form.getValues("assignedTo") });
      setAttachment(null);
    },
    onError: () => {
      toast.error("No se pudo crear la tarea");
    },
  });

  return (
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
                <FormLabel>Vencimiento (opcional)</FormLabel>
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
          <p className="text-xs text-slate-brand">
            Vinculá la tarea a un candidato, búsqueda, postulación o cliente.
          </p>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-electric hover:bg-electric-light text-white rounded-md px-5 py-2 font-semibold hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.3)] transition-all"
          >
            {isPending ? "Creando..." : "Crear tarea"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
