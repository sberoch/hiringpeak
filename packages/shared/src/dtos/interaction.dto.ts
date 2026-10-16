import { z } from "zod";
import { InteractionType } from "../enums";

/** Day-granular date string `YYYY-MM-DD`. */
const DayDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

const InteractionTypeSchema = z.enum(
  Object.values(InteractionType) as [InteractionType, ...InteractionType[]],
);

const ContactIdsSchema = z.array(z.number().int().positive());

/**
 * Log an Interaction: with Contacts, a Company, or both (at least one).
 * An absent `companyId` defaults to the Opportunity's Company, else the
 * Contacts' shared current Company; `null` records it without a Company.
 */
export const CreateInteractionSchema = z.object({
  type: InteractionTypeSchema,
  date: DayDateSchema,
  summary: z.string().trim().min(1),
  contactIds: ContactIdsSchema.optional(),
  companyId: z.number().int().positive().nullable().optional(),
  opportunityId: z.number().int().positive().nullable().optional(),
});

/**
 * What happened, without who or where: the first Interaction recorded with a
 * Contact being created (Quick capture), with them and at their Company.
 */
export const FirstInteractionSchema = CreateInteractionSchema.pick({
  type: true,
  date: true,
  summary: true,
});

/** Edit what happened and who it was with; the Company stays as recorded. */
export const UpdateInteractionSchema = z.object({
  type: InteractionTypeSchema.optional(),
  date: DayDateSchema.optional(),
  summary: z.string().trim().min(1).optional(),
  contactIds: ContactIdsSchema.optional(),
});

/** Interactions of a Company (at the time), a Contact or an Opportunity. */
export const InteractionQueryParamsSchema = z.object({
  companyId: z.coerce.number().int().positive().optional(),
  contactId: z.coerce.number().int().positive().optional(),
  opportunityId: z.coerce.number().int().positive().optional(),
});

export type CreateInteractionDto = z.infer<typeof CreateInteractionSchema>;
export type FirstInteractionDto = z.infer<typeof FirstInteractionSchema>;
export type UpdateInteractionDto = z.infer<typeof UpdateInteractionSchema>;
export type InteractionQueryParamsDto = z.infer<
  typeof InteractionQueryParamsSchema
>;
