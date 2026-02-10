import { z } from "zod";

export const newOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
  userName: z
    .string()
    .min(1, "El nombre del usuario es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres"),
});

export type NewOrganizationSchema = z.infer<typeof newOrganizationSchema>;
