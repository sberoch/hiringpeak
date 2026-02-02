import { z } from "zod";

import { CompanyStatusEnum } from "@workspace/shared/types/company";

export const editCompanyFormSchema = z.object({
  status: z.nativeEnum(CompanyStatusEnum, {
    required_error: "El estado es requerido",
  }),
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  description: z.string().optional().or(z.literal("")),
  clientName: z.string().optional().or(z.literal("")),
  clientEmail: z
    .string()
    .email({ message: "Ingrese un email válido." })
    .optional()
    .or(z.literal("")),
  clientPhone: z.string().optional().or(z.literal("")),
});

export type EditCompanyFormSchema = z.infer<typeof editCompanyFormSchema>;
