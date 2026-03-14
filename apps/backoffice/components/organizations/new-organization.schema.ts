import { z } from "zod";

import { passwordSchema } from "@workspace/shared/lib/password.schema";

export const newOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.email("Email inválido"),
  password: passwordSchema,
  userName: z
    .string()
    .min(1, "El nombre del usuario es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres"),
});

export type NewOrganizationSchema = z.infer<typeof newOrganizationSchema>;
