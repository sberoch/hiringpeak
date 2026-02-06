import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { Textarea } from "@workspace/ui/components/textarea";
import { COMPANIES_API_KEY, updateCompany } from "@/lib/api/company";
import { Company, COMPANY_STATUS_NAMES } from "@workspace/shared/types/company";

import {
  editCompanyFormSchema,
  type EditCompanyFormSchema,
} from "./edit-company.schema";

interface EditCompanySheetProps {
  company: Company;
  isOpen: boolean;
  onClose: () => void;
}

export function EditCompanySheet({
  company,
  isOpen,
  onClose,
}: EditCompanySheetProps) {
  const queryClient = useQueryClient();

  const form = useForm<EditCompanyFormSchema>({
    resolver: zodResolver(editCompanyFormSchema),
    defaultValues: {
      name: company.name,
      description: company.description || "",
      status: company.status,
      clientName: company.clientName || "",
      clientEmail: company.clientEmail || "",
      clientPhone: company.clientPhone || "",
    },
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: EditCompanyFormSchema) =>
      updateCompany(company.id.toString(), values),
    onSuccess: () => {
      toast.success("Empresa actualizada exitosamente");
      queryClient
        .invalidateQueries({ queryKey: [COMPANIES_API_KEY] })
        .then(() => onClose());
    },
  });

  function onSubmit(values: EditCompanyFormSchema) {
    mutateAsync(values);
  }

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-[90%] sm:w-auto sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar empresa</SheetTitle>
          <SheetDescription>
            Modifique los datos de la empresa {company.name}.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

              <SheetFooter className="pt-4">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar cambios"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
