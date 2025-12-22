import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto.js";

export const CreateSenioritySchema = z.object({
  name: z.string().min(1),
});

export const UpdateSenioritySchema = CreateSenioritySchema.partial();

export const SeniorityQueryParamsSchema = PaginationParamsSchema;

export type CreateSeniorityDto = z.infer<typeof CreateSenioritySchema>;
export type UpdateSeniorityDto = z.infer<typeof UpdateSenioritySchema>;
export type SeniorityQueryParamsDto = z.infer<
  typeof SeniorityQueryParamsSchema
>;
