import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto.js";

export const VacancyFiltersSchema = z.object({
  seniorityIds: z.array(z.number().int()).optional(),
  areaIds: z.array(z.number().int()).optional(),
  industryIds: z.array(z.number().int()).optional(),
  minStars: z.number().optional(),
  gender: z.string().optional(),
  minAge: z.number().int().optional(),
  maxAge: z.number().int().optional(),
  countries: z.array(z.string()).optional(),
  provinces: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
});

export const CreateVacancySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  salary: z.string().optional().nullable(),
  statusId: z.number().int(),
  filters: VacancyFiltersSchema,
  companyId: z.number().int(),
  createdBy: z.number().int(),
  assignedTo: z.number().int(),
});

export const UpdateVacancySchema = CreateVacancySchema.partial();

export const VacancyQueryParamsSchema = PaginationParamsSchema.extend({
  id: z.coerce.number().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  statusId: z.coerce.number().optional(),
  companyId: z.coerce.number().optional(),
  createdById: z.coerce.number().optional(),
  assignedToId: z.coerce.number().optional(),
  filterSeniorityIds: z
    .union([
      z.array(z.coerce.number()),
      z.coerce.number().transform((v) => [v]),
    ])
    .optional(),
  filterAreaIds: z
    .union([
      z.array(z.coerce.number()),
      z.coerce.number().transform((v) => [v]),
    ])
    .optional(),
  filterIndustryIds: z
    .union([
      z.array(z.coerce.number()),
      z.coerce.number().transform((v) => [v]),
    ])
    .optional(),
  filterMinStars: z.coerce.number().optional(),
  filterGender: z.string().optional(),
  filterMinAge: z.coerce.number().int().optional(),
  filterMaxAge: z.coerce.number().int().optional(),
  filterCountries: z
    .union([z.array(z.string()), z.string().transform((v) => [v])])
    .optional(),
  filterProvinces: z
    .union([z.array(z.string()), z.string().transform((v) => [v])])
    .optional(),
  filterLanguages: z
    .union([z.array(z.string()), z.string().transform((v) => [v])])
    .optional(),
  search: z.string().optional(),
});

export type VacancyFiltersDto = z.infer<typeof VacancyFiltersSchema>;
export type CreateVacancyDto = z.infer<typeof CreateVacancySchema>;
export type UpdateVacancyDto = z.infer<typeof UpdateVacancySchema>;
export type VacancyQueryParamsDto = z.infer<typeof VacancyQueryParamsSchema>;
