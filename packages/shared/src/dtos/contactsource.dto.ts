import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto.js";

export const CreateContactSourceSchema = z.object({
  name: z.string().trim().min(1),
  sort: z.number().int().optional(),
});

export const UpdateContactSourceSchema = CreateContactSourceSchema.partial();

export const ContactSourceQueryParamsSchema = PaginationParamsSchema;

export type CreateContactSourceDto = z.infer<typeof CreateContactSourceSchema>;
export type UpdateContactSourceDto = z.infer<typeof UpdateContactSourceSchema>;
export type ContactSourceQueryParamsDto = z.infer<
  typeof ContactSourceQueryParamsSchema
>;
