import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto";

/** Day-granular date string `YYYY-MM-DD`. */
const DayDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

const AttachmentIdsSchema = z.array(z.number().int()).optional();

/** A Task attaches to any number of records of each type (ADR 0005). */
const TaskAttachmentIdsShape = {
  candidateIds: AttachmentIdsSchema,
  vacancyIds: AttachmentIdsSchema,
  candidacyIds: AttachmentIdsSchema,
  companyIds: AttachmentIdsSchema,
  contactIds: AttachmentIdsSchema,
  opportunityIds: AttachmentIdsSchema,
};

/**
 * Tasks page pills, as attachment classes: `commercial` = any Opportunity or
 * Contact attached, or stayed commercial; `vacancies` = any Vacancy,
 * Candidate or Candidacy attached.
 */
export const TaskAttachmentClassSchema = z.enum(["commercial", "vacancies"]);

export const CreateTaskSchema = z.object({
  title: z.string().min(1),
  dueDate: DayDateSchema.nullable().optional(),
  assignedTo: z.number().int(),
  ...TaskAttachmentIdsShape,
});

/**
 * Edit a Task: title, due date, Task Owner or attachments. Each attachment
 * list, when present, replaces that type's attachments (`[]` clears them);
 * an absent list leaves that type untouched.
 * Mutation of completion state lives on dedicated endpoints.
 */
export const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  dueDate: DayDateSchema.nullable().optional(),
  assignedTo: z.number().int().optional(),
  ...TaskAttachmentIdsShape,
});

export const TaskQueryParamsSchema = PaginationParamsSchema.extend({
  id: z.coerce.number().optional(),
  assignedTo: z.coerce.number().optional(),
  createdBy: z.coerce.number().optional(),
  completed: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((v) => (typeof v === "string" ? v === "true" : v))
    .optional(),
  /** Tasks attached to this Candidate (among other records, possibly). */
  candidateId: z.coerce.number().optional(),
  vacancyId: z.coerce.number().optional(),
  candidacyId: z.coerce.number().optional(),
  companyId: z.coerce.number().optional(),
  contactId: z.coerce.number().optional(),
  opportunityId: z.coerce.number().optional(),
  attachmentClass: TaskAttachmentClassSchema.optional(),
});

export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskDto = z.infer<typeof UpdateTaskSchema>;
export type TaskAttachmentClass = z.infer<typeof TaskAttachmentClassSchema>;
export type TaskQueryParamsDto = z.infer<typeof TaskQueryParamsSchema>;
