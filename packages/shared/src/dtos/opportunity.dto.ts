import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto";
import { CompanyStatus } from "../enums";

/** Day-granular date string `YYYY-MM-DD`. */
const DayDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

const EstimatedFeeSchema = z.number().nonnegative().nullable();

export const CreateOpportunitySchema = z.object({
  title: z.string().trim().min(1),
  companyId: z.number().int(),
  estimatedFee: EstimatedFeeSchema.optional(),
  /** Opportunity Owner; defaults to the Company's Account Owner, else the creator. */
  ownerId: z.number().int().optional(),
});

/**
 * "Crear oportunidad" from a Contact. A Contact with a Company brings it along
 * (omit both Company fields); a Contact without one needs exactly one of
 * `companyId` (pick) or `newCompanyName` (create), which also becomes the
 * Contact's Company. The Contact is added to the new Opportunity.
 */
export const CreateOpportunityFromContactSchema = z.object({
  title: z.string().trim().min(1),
  estimatedFee: EstimatedFeeSchema.optional(),
  /** Opportunity Owner; defaults to the Company's Account Owner, else the creator. */
  ownerId: z.number().int().optional(),
  companyId: z.number().int().nullable().optional(),
  newCompanyName: z.string().trim().min(1).nullable().optional(),
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
  /** Only the Opportunities this Contact is part of. */
  contactId: z.coerce.number().int().optional(),
  /** Only Opportunities at Prospect (or Client) Companies. */
  companyStatus: z.nativeEnum(CompanyStatus).optional(),
  /** "Solo sin próximo paso": only open Opportunities with No Next Step. */
  noNextStep: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((v) => (typeof v === "string" ? v === "true" : v))
    .optional(),
  /**
   * `"closeDate:asc|desc"` or `"createdAt:asc|desc"`; newest first when
   * omitted. Groups by stage keep this order.
   */
  order: z.string().optional(),
});

export const OpportunityStageQueryParamsSchema = PaginationParamsSchema;
export const LostReasonQueryParamsSchema = PaginationParamsSchema;

export type CreateOpportunityDto = z.infer<typeof CreateOpportunitySchema>;
export type CreateOpportunityFromContactDto = z.infer<
  typeof CreateOpportunityFromContactSchema
>;
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
