import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto.js";

/** Day-granular date string `YYYY-MM-DD`. */
const DayDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

const EstimatedFeeSchema = z.number().nonnegative().nullable();

export const CreateOpportunitySchema = z.object({
  title: z.string().trim().min(1),
  companyId: z.number().int(),
  estimatedFee: EstimatedFeeSchema.optional(),
  /** Opportunity Owner; defaults to the creator. */
  ownerId: z.number().int().optional(),
});

/** Edit the facts. The stage and its outcome fields change via the stage endpoint. */
export const UpdateOpportunitySchema = z.object({
  title: z.string().trim().min(1).optional(),
  companyId: z.number().int().optional(),
  estimatedFee: EstimatedFeeSchema.optional(),
  ownerId: z.number().int().optional(),
});

/**
 * Move an Opportunity to another stage. Entering lost requires `lostReasonId`;
 * entering won or lost takes an optional (backdatable) `closeDate`, default today.
 */
export const ChangeOpportunityStageSchema = z.object({
  stageId: z.number().int(),
  lostReasonId: z.number().int().nullable().optional(),
  closeDate: DayDateSchema.nullable().optional(),
});

/** Edit the Close Date of a won or lost Opportunity. */
export const UpdateOpportunityCloseDateSchema = z.object({
  closeDate: DayDateSchema,
});

/**
 * "Crear vacante" on a won Opportunity: one Vacancy at a time, on the
 * Opportunity's Company, linked back to it.
 */
export const CreateVacancyFromOpportunitySchema = z.object({
  title: z.string().trim().min(1),
  /** Vacancy Owner (any User). */
  assignedTo: z.number().int(),
  /** Vacancy Contact: one of the Company's current Contacts, or none. */
  vacancyContactId: z.number().int().nullable().optional(),
});

export const OpportunityQueryParamsSchema = z.object({
  search: z.string().optional(),
  ownerId: z.coerce.number().int().optional(),
  lostReasonId: z.coerce.number().int().optional(),
  companyId: z.coerce.number().int().optional(),
});

export const OpportunityStageQueryParamsSchema = PaginationParamsSchema;
export const LostReasonQueryParamsSchema = PaginationParamsSchema;

export type CreateOpportunityDto = z.infer<typeof CreateOpportunitySchema>;
export type UpdateOpportunityDto = z.infer<typeof UpdateOpportunitySchema>;
export type ChangeOpportunityStageDto = z.infer<
  typeof ChangeOpportunityStageSchema
>;
export type UpdateOpportunityCloseDateDto = z.infer<
  typeof UpdateOpportunityCloseDateSchema
>;
export type CreateVacancyFromOpportunityDto = z.infer<
  typeof CreateVacancyFromOpportunitySchema
>;
export type OpportunityQueryParamsDto = z.infer<
  typeof OpportunityQueryParamsSchema
>;
