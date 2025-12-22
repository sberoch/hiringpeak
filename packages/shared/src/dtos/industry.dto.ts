import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto.js";

export const CreateIndustrySchema = z.object({
  name: z.string().min(1),
});

export const UpdateIndustrySchema = CreateIndustrySchema.partial();

export const IndustryQueryParamsSchema = PaginationParamsSchema;

export type CreateIndustryDto = z.infer<typeof CreateIndustrySchema>;
export type UpdateIndustryDto = z.infer<typeof UpdateIndustrySchema>;
export type IndustryQueryParamsDto = z.infer<typeof IndustryQueryParamsSchema>;
