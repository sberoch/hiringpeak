import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto.js";

/**
 * Notification kinds. `assigned` is sync (Task service); `due`/`overdue`
 * are reserved for the deadline sweep (separate slice).
 */
export const NotificationKind = {
  ASSIGNED: "assigned",
  DUE: "due",
  OVERDUE: "overdue",
} as const;
export type NotificationKind =
  (typeof NotificationKind)[keyof typeof NotificationKind];

export const NotificationKindSchema = z.enum(["assigned", "due", "overdue"]);

export const NotificationQueryParamsSchema = PaginationParamsSchema.extend({
  unreadOnly: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((v) => (typeof v === "string" ? v === "true" : v))
    .optional(),
});

export type NotificationQueryParamsDto = z.infer<
  typeof NotificationQueryParamsSchema
>;
