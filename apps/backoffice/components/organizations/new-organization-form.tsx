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
  onboardOrganization,
  ORGANIZATIONS_API_KEY,
} from "@/lib/api/organization";

import {
  newOrganizationSchema,
  type NewOrganizationSchema,
} from "./new-organization.schema";

interface NewOrganizationFormProps {
  onSuccess?: () => void;
}

export function NewOrganizationForm({ onSuccess }: NewOrganizationFormProps) {
  const queryClient = useQueryClient();
  const form = useForm<NewOrganizationSchema>({
    resolver: zodResolver(newOrganizationSchema),
    defaultValues: { name: "", email: "", password: "", userName: "" },
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: NewOrganizationSchema) =>
      onboardOrganization({
        organizationName: values.name,
        email: values.email,
        password: values.password,
        name: values.userName,
      }),
    onSuccess: () => {
      toast.success("Organización y usuario creados correctamente");
      queryClient.invalidateQueries({ queryKey: [ORGANIZATIONS_API_KEY] });
      form.reset();
      onSuccess?.();
    },
  });

  function handleSubmit(values: NewOrganizationSchema) {
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
              <FormLabel>Nombre de la organización</FormLabel>
              <FormControl>
                <Input placeholder="Nombre de la organización" {...field} />
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
              <FormLabel>Email del primer usuario</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  {...field}
                />
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
                <Input type="password" placeholder="Mínimo 8 caracteres" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="userName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del primer usuario</FormLabel>
              <FormControl>
                <Input placeholder="Nombre del usuario" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creando..." : "Crear organización"}
        </Button>
      </form>
    </Form>
  );
}
