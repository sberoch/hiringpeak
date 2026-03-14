import { z } from "zod";

export const LoginOrigin = z.enum(["web", "backoffice"]);
export type LoginOrigin = z.infer<typeof LoginOrigin>;

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  origin: LoginOrigin.default("web"),
});

export type LoginDto = z.infer<typeof LoginSchema>;
