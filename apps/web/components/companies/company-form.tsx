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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Company,
  CompanyStatusEnum,
  COMPANY_STATUS_NAMES,
} from "@workspace/shared/types/company";
import { COMPANIES_API_KEY, createCompany } from "@/lib/api/company";

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
    status: CompanyStatusEnum.PROSPECT,
    clientName: "",
    clientEmail: "",
    clientPhone: "",
  },
  submitLabel = "Crear empresa",
}: CompanyFormProps) {
  const queryClient = useQueryClient();
  const form = useForm<CompanyFormSchema>({
    resolver: zodResolver(companyFormSchema),
    defaultValues,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: CompanyFormSchema) => createCompany(values),
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

        <FormField
          control={form.control}
          name="clientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del cliente</FormLabel>
              <FormControl>
                <Input placeholder="Nombre del cliente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="clientEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email del cliente</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="cliente@empresa.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="clientPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono del cliente</FormLabel>
              <FormControl>
                <Input placeholder="Teléfono" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(COMPANY_STATUS_NAMES).map(
                      ([status, name]) => (
                        <SelectItem value={status} key={status}>
                          {name}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
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
