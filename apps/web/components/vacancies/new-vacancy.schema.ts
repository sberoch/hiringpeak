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

export const createVacancyFormSchema = z.object({
  title: z.string().min(2, {
    message: "El título debe tener al menos 2 caracteres.",
  }),
  description: z.string().optional(),
  status: z.string({ error: "Seleccione estado" }),
  company: z.string({ error: "Seleccione companía" }),
  filters: z
    .object({
      seniorities: z.array(senioritySchema).optional(),
      areas: z.array(areaSchema).optional(),
      industries: z.array(industrySchema).optional(),
      minStars: z.number().min(0).max(5).optional(),
      gender: z.string().optional(),
      minAge: z.number().min(18).optional(),
      maxAge: z.number().optional(),
      countries: z.array(z.string()).optional(),
      provinces: z.array(z.string()).optional(),
      languages: z.array(z.string()).optional(),
    })
    .optional(),
  createdBy: z.number(),
  assignedTo: z.number(),
});

export type CreateVacancyFormSchema = z.infer<typeof createVacancyFormSchema>;

export const createVacancySchema = z.object({
  title: z.string().min(2, {
    message: "El título debe tener al menos 2 caracteres.",
  }),
  description: z.string().optional(),
  statusId: z.number({
    error: "El estado es requerido.",
  }),
  companyId: z.number({
    error: "La empresa es requerida.",
  }),
  filters: z
    .object({
      seniorityIds: z.array(z.number()).optional(),
      areaIds: z.array(z.number()).optional(),
      industryIds: z.array(z.number()).optional(),
      minStars: z.number().min(0).max(5).optional(),
      gender: z.string().optional(),
      minAge: z.number().min(18).optional(),
      maxAge: z.number().optional(),
      countries: z.array(z.string()).optional(),
      provinces: z.array(z.string()).optional(),
      languages: z.array(z.string()).optional(),
    })
    .optional(),
  createdBy: z.number({ error: "Es requerido el creador" }),
  assignedTo: z.number({ error: "Es requerida una asignación" }),
});

export type CreateVacancySchema = z.infer<typeof createVacancySchema>;
