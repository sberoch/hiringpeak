import { z } from "zod";

export const editCompanyFormSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  description: z.string().optional().or(z.literal("")),
});

export type EditCompanyFormSchema = z.infer<typeof editCompanyFormSchema>;
