"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
import { PasswordRequirements } from "@workspace/ui/custom/password-requirements";
import { ROLES_NAMES, User, UserRoleEnum } from "@workspace/shared/types/user";
import { createUser, USERS_API_KEY } from "@/lib/api/user";

import { userFormSchema, type UserFormSchema } from "./new-user.schema";

interface UserFormProps {
  onSubmit: (values?: User) => void;
  defaultValues?: Partial<UserFormSchema>;
  submitLabel?: string;
}

export function UserForm({
  onSubmit,
  defaultValues = {
    name: "",
    email: "",
    password: "",
  },
  submitLabel = "Crear usuario",
}: UserFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<UserFormSchema>({
    resolver: zodResolver(userFormSchema),
    defaultValues,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: UserFormSchema) => createUser(values),
    onSuccess: (values) => {
      toast.success("Usuario creado exitosamente");
      queryClient
        .invalidateQueries({ queryKey: [USERS_API_KEY] })
        .then(() => onSubmit?.(values));
    },
  });

  function handleSubmit(values: UserFormSchema) {
    mutateAsync(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Nombre del usuario" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input placeholder="Email" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input placeholder="Contraseña" type="password" {...field} />
              </FormControl>
              <PasswordRequirements
                password={form.watch("password") ?? ""}
                className="mt-2"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rol</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(UserRoleEnum).map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLES_NAMES[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />
        <div className="pt-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creando..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
