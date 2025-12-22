import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto.js";

export const CreateVacancyStatusSchema = z.object({
  name: z.string().min(1),
});

export const UpdateVacancyStatusSchema = CreateVacancyStatusSchema.partial();

export const VacancyStatusQueryParamsSchema = PaginationParamsSchema;

export type CreateVacancyStatusDto = z.infer<typeof CreateVacancyStatusSchema>;
export type UpdateVacancyStatusDto = z.infer<typeof UpdateVacancyStatusSchema>;
export type VacancyStatusQueryParamsDto = z.infer<
  typeof VacancyStatusQueryParamsSchema
>;
