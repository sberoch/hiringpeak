import { z } from "zod";

import { CompanyStatusEnum } from "@workspace/shared/types/company";
import type { CreateVacancySchema } from "@/components/vacancies/new-vacancy.schema";
import type { EditVacancySchema } from "@/components/vacancies/edit-vacancy.schema";

const REQUIRED_MESSAGE = "Este campo es obligatorio.";

const companySchema = z.object(
  {
    id: z.number(),
    status: z.enum([CompanyStatusEnum.ACTIVE, CompanyStatusEnum.PROSPECT]),
    name: z.string(),
    description: z.string().optional(),
  },
  { error: REQUIRED_MESSAGE },
);

const vacancyStatusSchema = z.object(
  {
    id: z.number(),
    name: z.string(),
  },
  { error: REQUIRED_MESSAGE },
);

const userSchema = z.object(
  {
    id: z.number(),
    name: z.string().optional(),
  },
  { error: REQUIRED_MESSAGE },
);

const senioritySchema = z.object({ id: z.number(), name: z.string() });
const areaSchema = z.object({ id: z.number(), name: z.string() });
const industrySchema = z.object({ id: z.number(), name: z.string() });

export const vacancyWizardFiltersSchema = z.object({
  seniorities: z.array(senioritySchema).optional(),
  areas: z.array(areaSchema).optional(),
  industries: z.array(industrySchema).optional(),
  minStars: z.number().min(0).max(5).optional().nullable(),
  gender: z.string().optional(),
  minAge: z.number().min(18).optional().nullable(),
  maxAge: z.number().optional().nullable(),
  countries: z.array(z.string()).optional(),
  provinces: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
});

export const vacancyWizardFormSchema = z.object({
  title: z.string().min(2, {
    message: "El título debe tener al menos 2 caracteres.",
  }),
  description: z.string().optional().or(z.literal("")),
  salary: z.string().optional().or(z.literal("")),
  status: vacancyStatusSchema,
  company: companySchema,
  createdBy: userSchema,
  assignedTo: userSchema,
  filters: vacancyWizardFiltersSchema.optional(),
});

export type VacancyWizardFormSchema = z.infer<typeof vacancyWizardFormSchema>;

export const STEP_FIELDS = {
  basicInfo: [
    "title",
    "description",
    "salary",
    "status",
    "company",
    "createdBy",
    "assignedTo",
  ],
  searchBrief: ["filters"],
} as const satisfies Record<string, ReadonlyArray<keyof VacancyWizardFormSchema>>;

export function wizardFormToCreate(
  form: VacancyWizardFormSchema,
): CreateVacancySchema {
  return {
    title: form.title,
    description: form.description || undefined,
    salary: form.salary || null,
    statusId: form.status.id,
    companyId: form.company.id,
    createdBy: form.createdBy.id,
    assignedTo: form.assignedTo.id,
    filters: {
      seniorityIds: form.filters?.seniorities?.map((s) => s.id) ?? [],
      areaIds: form.filters?.areas?.map((a) => a.id) ?? [],
      industryIds: form.filters?.industries?.map((i) => i.id) ?? [],
      minStars: form.filters?.minStars ?? undefined,
      gender: form.filters?.gender,
      minAge: form.filters?.minAge ?? undefined,
      maxAge: form.filters?.maxAge ?? undefined,
      countries: form.filters?.countries,
      provinces: form.filters?.provinces,
      languages: form.filters?.languages,
    },
  };
}

export function wizardFormToUpdate(
  form: VacancyWizardFormSchema,
): EditVacancySchema {
  return {
    title: form.title,
    description: form.description || undefined,
    salary: form.salary || null,
    statusId: form.status.id,
    companyId: form.company.id,
    createdBy: form.createdBy.id,
    assignedTo: form.assignedTo.id,
    filters: {
      seniorityIds: form.filters?.seniorities?.map((s) => s.id) ?? [],
      areaIds: form.filters?.areas?.map((a) => a.id) ?? [],
      industryIds: form.filters?.industries?.map((i) => i.id) ?? [],
      minStars: form.filters?.minStars ?? undefined,
      gender: form.filters?.gender,
      minAge: form.filters?.minAge ?? undefined,
      maxAge: form.filters?.maxAge ?? undefined,
      countries: form.filters?.countries,
      provinces: form.filters?.provinces,
      languages: form.filters?.languages,
    },
  };
}
