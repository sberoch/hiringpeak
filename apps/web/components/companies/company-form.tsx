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
import { Textarea } from "@workspace/ui/components/textarea";
import { Company } from "@workspace/shared/types/company";
import { COMPANIES_API_KEY, createCompany } from "@/lib/api/company";
import { createContact } from "@/lib/api/contact";

import { companyFormSchema, type CompanyFormSchema } from "./new-company.schema";

interface CompanyFormProps {
  onSubmit?: (values?: Company) => void;
  defaultValues?: Partial<CompanyFormSchema>;
  submitLabel?: string;
}

export function CompanyForm({
  onSubmit,
  defaultValues = {
    name: "",
    description: "",
    contactName: "",
    contactRole: "",
    contactEmail: "",
    contactPhone: "",
  },
  submitLabel = "Crear empresa",
}: CompanyFormProps) {
  const queryClient = useQueryClient();
  const form = useForm<CompanyFormSchema>({
    resolver: zodResolver(companyFormSchema),
    defaultValues,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (values: CompanyFormSchema) => {
      const {
        contactName,
        contactRole,
        contactEmail,
        contactPhone,
        ...companyValues
      } = values;
      const company = await createCompany(companyValues);
      if (contactName?.trim()) {
        await createContact({
          companyId: company.id,
          name: contactName.trim(),
          role: contactRole?.trim() ?? "",
          email: contactEmail?.trim() || null,
          phone: contactPhone?.trim() || null,
        });
      }
      return company;
    },
    onSuccess: (values) => {
      toast.success("Empresa creada exitosamente");
      queryClient
        .invalidateQueries({ queryKey: [COMPANIES_API_KEY] })
        .then(() => onSubmit?.(values));
    },
  });

  function handleSubmit(values: CompanyFormSchema) {
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
                <Input placeholder="Nombre de la empresa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción de la empresa"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 rounded-xl border border-brand-border p-4">
          <div>
            <p className="text-sm font-semibold text-ink">
              Primer contacto{" "}
              <span className="font-normal text-muted-brand">(opcional)</span>
            </p>
            <p className="text-xs text-muted-brand">
              Una persona de la empresa con la que tratamos. Podés agregar más
              desde la pestaña Contactos.
            </p>
          </div>
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre y apellido"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactRole"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cargo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej. Gerente de RR.HH."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="nombre@empresa.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+54 11 5555-0000"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={isPending} className="w-full bg-electric hover:bg-electric-light text-white rounded-md py-2.5 font-semibold shadow-none hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.3)] transition-all cursor-pointer">
            {isPending ? "Creando..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
