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

/**
 * Closing a Vacancy: move it to a terminal (isFinal) Vacancy Status and record
 * the Close Date. The date is recruiter-chosen and intentionally NOT range-validated
 * (backdating to before the Vacancy existed is permitted by design); it is only
 * guarded where rendered. Day-granular `YYYY-MM-DD` or a full ISO string.
 */
export const CloseVacancySchema = z.object({
  statusId: z.number().int(),
  closedAt: z.string().min(1),
});

/**
 * Reopening a Vacancy: clear its Close Date and move it back to a non-final status.
 * `statusId` is optional — when omitted the service falls back to the Organization's
 * first non-final status.
 */
export const ReopenVacancySchema = z.object({
  statusId: z.number().int().optional(),
});

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

/**
 * Query params for the Vacancy List Report PDF: the same filter surface as the
 * list endpoint, plus `appliedFilters` — display-only, human-readable filter
 * labels echoed back from the frontend (which already holds the filter objects).
 * These drive only the "Filtros aplicados" caption; the real filtering is done
 * by the IDs above. Pagination params are accepted but ignored (the report
 * exports the whole filtered set).
 */
export const VacancyListReportQueryParamsSchema =
  VacancyQueryParamsSchema.extend({
    appliedFilters: z
      .union([z.array(z.string()), z.string().transform((v) => [v])])
      .optional(),
  });

export type VacancyFiltersDto = z.infer<typeof VacancyFiltersSchema>;
export type CreateVacancyDto = z.infer<typeof CreateVacancySchema>;
export type UpdateVacancyDto = z.infer<typeof UpdateVacancySchema>;
export type CloseVacancyDto = z.infer<typeof CloseVacancySchema>;
export type ReopenVacancyDto = z.infer<typeof ReopenVacancySchema>;
export type VacancyQueryParamsDto = z.infer<typeof VacancyQueryParamsSchema>;
export type VacancyListReportQueryParamsDto = z.infer<
  typeof VacancyListReportQueryParamsSchema
>;
