import { z } from "zod";

export const companyFormSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  description: z.string().optional(),
  /** Optional first Contact, created on the new Company. */
  contactName: z.string().optional().or(z.literal("")),
  contactRole: z.string().optional().or(z.literal("")),
  contactEmail: z
    .string()
    .email({
      message: "Ingrese un email válido.",
    })
    .optional()
    .or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
}).refine(
  (values) =>
    !!values.contactName?.trim() ||
    !(
      values.contactRole?.trim() ||
      values.contactEmail?.trim() ||
      values.contactPhone?.trim()
    ),
  {
    message: "Ingresá el nombre del contacto.",
    path: ["contactName"],
  },
);

export type CompanyFormSchema = z.infer<typeof companyFormSchema>;
