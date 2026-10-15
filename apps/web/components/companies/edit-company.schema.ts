import { z } from "zod";

import { CompanyStatusEnum } from "@workspace/shared/types/company";

export const editCompanyFormSchema = z.object({
  status: z.nativeEnum(CompanyStatusEnum, {
    error: "El estado es requerido",
  }),
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  description: z.string().optional().or(z.literal("")),
});

export type EditCompanyFormSchema = z.infer<typeof editCompanyFormSchema>;
