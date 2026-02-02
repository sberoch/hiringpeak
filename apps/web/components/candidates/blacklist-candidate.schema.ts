import * as z from "zod";

export const blacklistCandidateSchema = z.object({
  reason: z
    .string()
    .min(1, { message: "La razón de blacklist es obligatoria" })
    .max(500, { message: "La razón no puede exceder 500 caracteres" }),
});

export type BlacklistCandidateSchema = z.infer<typeof blacklistCandidateSchema>;
