import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto.js";

export const CreateBlacklistSchema = z.object({
  candidateId: z.number().int(),
  reason: z.string().min(1),
  userId: z.number().int(),
});

export const UpdateBlacklistSchema = CreateBlacklistSchema.partial();

export const BlacklistQueryParamsSchema = PaginationParamsSchema.extend({
  id: z.coerce.number().optional(),
  candidateId: z.coerce.number().optional(),
  reason: z.string().optional(),
  userId: z.coerce.number().optional(),
});

export type CreateBlacklistDto = z.infer<typeof CreateBlacklistSchema>;
export type UpdateBlacklistDto = z.infer<typeof UpdateBlacklistSchema>;
export type BlacklistQueryParamsDto = z.infer<typeof BlacklistQueryParamsSchema>;

