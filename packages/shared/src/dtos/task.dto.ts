import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto.js";

/** Day-granular date string `YYYY-MM-DD`. */
const DayDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const CreateTaskSchema = z.object({
  title: z.string().min(1),
  dueDate: DayDateSchema.nullable().optional(),
  assignedTo: z.number().int(),
  candidateId: z.number().int().nullable().optional(),
  vacancyId: z.number().int().nullable().optional(),
  candidateVacancyId: z.number().int().nullable().optional(),
  companyId: z.number().int().nullable().optional(),
});

export const TaskQueryParamsSchema = PaginationParamsSchema.extend({
  id: z.coerce.number().optional(),
  assignedTo: z.coerce.number().optional(),
  createdBy: z.coerce.number().optional(),
  completed: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((v) => (typeof v === "string" ? v === "true" : v))
    .optional(),
  candidateId: z.coerce.number().optional(),
  vacancyId: z.coerce.number().optional(),
  candidateVacancyId: z.coerce.number().optional(),
  companyId: z.coerce.number().optional(),
});

export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;
export type TaskQueryParamsDto = z.infer<typeof TaskQueryParamsSchema>;
