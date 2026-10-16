import { z } from "zod";
import { FirstInteractionSchema } from "./interaction.dto";
import { PaginationParamsSchema } from "./pagination.dto";

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
  /** Pick or create: a new Company with this name becomes the Contact's Company. */
  newCompanyName: optionalText,
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
  /**
   * "Abordar en X días": schedules a follow-up Task attached to the new
   * Contact, due today + X and owned by the Contact Owner. Create only.
   */
  followUpInDays: z.number().int().min(0).max(999).nullable().optional(),
  /**
   * Quick capture: an Interaction with the new Contact, saved with them (at
   * their Company). Create only; needs CRM_MANAGE.
   */
  firstInteraction: FirstInteractionSchema.nullable().optional(),
});

/** A plain edit; changing the Company moves the person to their new employer. */
export const UpdateContactSchema = CreateContactSchema.omit({
  followUpInDays: true,
  firstInteraction: true,
}).partial();

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
  /** Last Interaction older than N days (never interacted counts as older). */
  lastInteractionOlderThan: z.coerce.number().int().positive().optional(),
  /** "Seguimiento: Para contactar": an open attached Task owned by the caller. */
  followUp: z.literal("mine").optional(),
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
