import { z } from "zod";

import { UserRoleEnum } from "@workspace/shared/types/user";

export const userFormSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Ingrese una dirección de correo electrónico válida.",
  }),
  password: z.string().min(8, {
    message: "La contraseña debe tener al menos 8 caracteres.",
  }),
  role: z.nativeEnum(UserRoleEnum),
});

export type UserFormSchema = z.infer<typeof userFormSchema>;
