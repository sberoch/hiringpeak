import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto.js";

export const AuditLogQueryParamsSchema = PaginationParamsSchema.extend({
  /** Filter by user who performed the action. */
  actorUserId: z.coerce.number().int().positive().optional(),
  /** Filter by entity type (e.g. user, role). */
  entityType: z.string().optional(),
  /** Filter by event type (e.g. create_user, update_role). */
  eventType: z.string().optional(),
  /** Start of date range (inclusive). ISO date or datetime. */
  dateFrom: z.string().optional(),
  /** End of date range (inclusive). ISO date or datetime. */
  dateTo: z.string().optional(),
});

export type AuditLogQueryParamsDto = z.infer<typeof AuditLogQueryParamsSchema>;
