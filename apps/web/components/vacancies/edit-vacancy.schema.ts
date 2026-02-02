import { z } from "zod";

import { CompanyStatusEnum } from "@workspace/shared/types/company";

const companySchema = z.object({
  id: z.number(),
  status: z.enum([CompanyStatusEnum.ACTIVE, CompanyStatusEnum.PROSPECT]),
  name: z.string(),
  description: z.string().optional(),
});

const vacancyStatusSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const senioritySchema = z.object({
  id: z.number(),
  name: z.string(),
});

const userSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
});

const areaSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const industrySchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const editVacancyFormSchema = z.object({
  title: z.string().min(2, {
    message: "El título debe tener al menos 2 caracteres.",
  }),
  description: z.string().optional().or(z.literal("")),
  status: vacancyStatusSchema,
  company: companySchema,
  filters: z
    .object({
      seniorities: z.array(senioritySchema).optional(),
      areas: z.array(areaSchema).optional(),
      industries: z.array(industrySchema).optional(),
      minStars: z.number().min(0).max(5).optional().nullable(),
      gender: z.string().optional(),
      minAge: z.number().min(18).optional().nullable(),
      maxAge: z.number().optional().nullable(),
    })
    .optional(),
  createdBy: userSchema,
  assignedTo: userSchema,
});

export type EditVacancyFormSchema = z.infer<typeof editVacancyFormSchema>;

export const editVacancySchema = z.object({
  title: z.string().min(2, {
    message: "El título debe tener al menos 2 caracteres.",
  }),
  description: z.string().optional().or(z.literal("")),
  statusId: z.number({
    required_error: "El estado es requerido.",
  }),
  companyId: z.number({
    required_error: "La empresa es requerida.",
  }),
  filters: z
    .object({
      seniorityIds: z.array(z.number()).optional().nullable(),
      areaIds: z.array(z.number()).optional().nullable(),
      industryIds: z.array(z.number()).optional().nullable(),
      minStars: z.number().min(0).max(5).optional().nullable(),
      gender: z.string().optional(),
      minAge: z.number().min(18).optional().nullable(),
      maxAge: z.number().optional().nullable(),
    })
    .optional(),
  createdBy: z.number({
    required_error: "Es requerido el creador",
  }),
  assignedTo: z.number({
    required_error: "Es requerida una asignación",
  }),
});

export type EditVacancySchema = z.infer<typeof editVacancySchema>;
