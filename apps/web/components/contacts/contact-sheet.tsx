"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import type { ContactView } from "@workspace/shared/types/contact";
import { COMPANIES_API_KEY } from "@/lib/api/company";
import {
  CONTACT_API_KEY,
  createContact,
  updateContact,
} from "@/lib/api/contact";
import { VACANCY_API_KEY } from "@/lib/api/vacancy";

const contactFormSchema = z.object({
  name: z.string().trim().min(1, { message: "El nombre es obligatorio." }),
  role: z.string(),
  email: z
    .string()
    .trim()
    .email({ message: "Ingrese un email válido." })
    .or(z.literal("")),
  phone: z.string(),
  linkedin: z.string(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactSheetProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: number;
  companyName: string;
  /** Edit this Contact; omit to create one on the Company. */
  contact?: ContactView | null;
}

export function ContactSheet({
  isOpen,
  onClose,
  companyId,
  companyName,
  contact,
}: ContactSheetProps) {
  const queryClient = useQueryClient();
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: contact?.name ?? "",
      role: contact?.role ?? "",
      email: contact?.email ?? "",
      phone: contact?.phone ?? "",
      linkedin: contact?.linkedin ?? "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: ContactFormValues) => {
      const payload = {
        name: values.name.trim(),
        role: values.role.trim(),
        email: values.email.trim() || null,
        phone: values.phone.trim() || null,
        linkedin: values.linkedin.trim() || null,
      };
      return contact
        ? updateContact(contact.id, payload)
        : createContact({ ...payload, companyId });
    },
    onSuccess: (saved) => {
      toast.success(contact ? "Contacto actualizado" : "Contacto agregado", {
        description: saved.name,
      });
      queryClient.invalidateQueries({ queryKey: [COMPANIES_API_KEY] });
      queryClient.invalidateQueries({ queryKey: [VACANCY_API_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTACT_API_KEY] });
      onClose();
    },
    onError: () => {
      toast.error("No se pudo guardar el contacto.");
    },
  });

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[90%] overflow-y-auto border-brand-border bg-surface sm:w-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold text-ink">
            {contact ? "Editar contacto" : "Nuevo contacto"}
          </SheetTitle>
          <SheetDescription className="text-slate-brand">
            Una persona de {companyName} con la que tratamos.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutate(values))}
            className="space-y-4 px-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej. Paula Ibáñez"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Gerente de RR.HH." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="email"
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+54 11 5555-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn</FormLabel>
                  <FormControl>
                    <Input placeholder="linkedin.com/in/…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter className="px-0">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-electric text-white hover:bg-electric-light"
              >
                {isPending
                  ? "Guardando..."
                  : contact
                    ? "Guardar cambios"
                    : "Agregar contacto"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
