import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto.js";

export const CreateAreaSchema = z.object({
  name: z.string().min(1),
});

export const UpdateAreaSchema = CreateAreaSchema.partial();

export const AreaQueryParamsSchema = PaginationParamsSchema;

export type CreateAreaDto = z.infer<typeof CreateAreaSchema>;
export type UpdateAreaDto = z.infer<typeof UpdateAreaSchema>;
export type AreaQueryParamsDto = z.infer<typeof AreaQueryParamsSchema>;
