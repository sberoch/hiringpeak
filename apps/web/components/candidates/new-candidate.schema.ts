import { z } from "zod";

const senioritySchema = z.object({
  id: z.number(),
  name: z.string(),
});

const areaSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const industrySchema = z.object({
  id: z.number(),
  name: z.string(),
});

const sourceSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const candidateFormSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  email: z
    .string()
    .email({
      message: "Ingrese una dirección de correo electrónico válida.",
    })
    .optional()
    .or(z.literal("")),
  shortDescription: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.string().min(1, {
    message: "El género es requerido.",
  }),
  address: z.string().optional().or(z.literal("")),
  linkedin: z
    .string()
    .url({
      message: "Ingrese una URL de LinkedIn válida.",
    })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  source: sourceSchema,
  seniorities: z.array(senioritySchema).min(1, {
    message: "Seleccione al menos un seniority.",
  }),
  areas: z.array(areaSchema).min(1, {
    message: "Seleccione al menos un área.",
  }),
  industries: z.array(industrySchema).min(1, {
    message: "Seleccione al menos una industria.",
  }),
  files: z.array(z.instanceof(File)).optional(),
  firstComment: z.string().optional().or(z.literal("")),
  countries: z.array(z.string()).min(1, { message: "El país es requerido" }),
  provinces: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  stars: z.number().min(0).max(5).optional(),
});

export type CandidateFormSchema = z.infer<typeof candidateFormSchema>;
