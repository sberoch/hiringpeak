import { z } from "zod";

const NameSchema = z.string().trim().min(1);
/** Position among the open stages (or among the Lost Reasons), from 0. */
const PositionSchema = z.number().int().nonnegative();

/** New open stage; `sort` defaults to last among the open stages. */
export const CreateOpportunityStageSchema = z.object({
  name: NameSchema,
  sort: PositionSchema.optional(),
});

/** Rename and/or move an open stage. Outcome flags change via the outcome endpoint. */
export const UpdateOpportunityStageSchema =
  CreateOpportunityStageSchema.partial();

/** Make this stage the won or the lost one, taking the flag from its holder. */
export const SetOpportunityStageOutcomeSchema = z.object({
  outcome: z.enum(["won", "lost"]),
});

export const CreateLostReasonSchema = z.object({
  name: NameSchema,
  sort: PositionSchema.optional(),
});

export const UpdateLostReasonSchema = CreateLostReasonSchema.partial();

export type CreateOpportunityStageDto = z.infer<
  typeof CreateOpportunityStageSchema
>;
export type UpdateOpportunityStageDto = z.infer<
  typeof UpdateOpportunityStageSchema
>;
export type SetOpportunityStageOutcomeDto = z.infer<
  typeof SetOpportunityStageOutcomeSchema
>;
export type CreateLostReasonDto = z.infer<typeof CreateLostReasonSchema>;
export type UpdateLostReasonDto = z.infer<typeof UpdateLostReasonSchema>;
