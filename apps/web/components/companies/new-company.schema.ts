import { z } from "zod";

import { CompanyStatusEnum } from "@workspace/shared/types/company";

export const companyFormSchema = z.object({
  status: z.nativeEnum(CompanyStatusEnum, {
    error: "El estado es requerido",
  }),
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  description: z.string().optional(),
  clientName: z.string().optional().or(z.literal("")),
  clientEmail: z
    .string()
    .email({
      message: "Ingrese un email válido.",
    })
    .optional()
    .or(z.literal("")),
  clientPhone: z.string().optional().or(z.literal("")),
});

export type CompanyFormSchema = z.infer<typeof companyFormSchema>;
