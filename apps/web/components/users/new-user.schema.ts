import { z } from "zod";

import { passwordSchema } from "@workspace/shared/lib/password.schema";

export const userFormSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  email: z.email({
    message: "Ingrese una dirección de correo electrónico válida.",
  }),
  password: passwordSchema,
  roleId: z.number().int().positive().optional(),
});

export type UserFormSchema = z.infer<typeof userFormSchema>;
