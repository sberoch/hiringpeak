import { z } from "zod";

export const PaginationParamsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  order: z.string().optional(),
});

export type PaginationParamsDto = z.infer<typeof PaginationParamsSchema>;
