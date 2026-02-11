import { z } from "zod";

import { passwordSchema } from "@workspace/shared/lib/password.schema";
import { UserRoleEnum } from "@workspace/shared/types/user";

export const userFormSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  email: z.email({
    message: "Ingrese una dirección de correo electrónico válida.",
  }),
  password: passwordSchema,
  role: z.enum(UserRoleEnum),
});

export type UserFormSchema = z.infer<typeof userFormSchema>;
