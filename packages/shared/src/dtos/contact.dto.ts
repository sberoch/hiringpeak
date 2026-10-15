import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto.js";

/** Optional free text: blank becomes null. */
const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional();

const optionalId = z.number().int().nullable().optional();

/**
 * A Contact. Their Company (current employer, ADR 0004) is optional; Contact
 * Source, Contact Owner and the short description are network-only fields
 * (commercial access). An absent `ownerId` defaults to the creator; `null`
 * means "Sin responsable".
 */
export const CreateContactSchema = z.object({
  companyId: optionalId,
  name: z.string().trim().min(1),
  role: z.string().trim().optional(),
  email: z
    .union([z.literal(""), z.string().trim().email()])
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional(),
  phone: optionalText,
  linkedin: optionalText,
  sourceId: optionalId,
  ownerId: optionalId,
  shortDescription: optionalText,
});

/** A plain edit; changing the Company moves the person to their new employer. */
export const UpdateContactSchema = CreateContactSchema.partial();

/** `company`: "with" / "without" a Company, or a Company id. */
const CompanyFilterSchema = z.union([
  z.enum(["with", "without"]),
  z.coerce.number().int().positive(),
]);

/** `ownerId` / `sourceId`: an id, or "none" for Contacts without one. */
const IdOrNoneSchema = z.union([
  z.literal("none"),
  z.coerce.number().int().positive(),
]);

export const ContactQueryParamsSchema = PaginationParamsSchema.extend({
  /** Name, email or Company name. */
  search: z.string().trim().optional(),
  ownerId: IdOrNoneSchema.optional(),
  sourceId: IdOrNoneSchema.optional(),
  company: CompanyFilterSchema.optional(),
});

/** Probe for probable duplicates before saving a new Contact. */
export const ContactDuplicatesQuerySchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  linkedin: z.string().optional(),
});

export type CreateContactDto = z.infer<typeof CreateContactSchema>;
export type UpdateContactDto = z.infer<typeof UpdateContactSchema>;
export type ContactQueryParamsDto = z.infer<typeof ContactQueryParamsSchema>;
export type ContactDuplicatesQueryDto = z.infer<
  typeof ContactDuplicatesQuerySchema
>;
