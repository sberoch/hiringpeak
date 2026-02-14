import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto.js";

export const PermissionQueryParamsSchema = PaginationParamsSchema.extend({
  code: z.string().optional(),
  label: z.string().optional(),
});

export const UpdatePermissionSchema = z.object({
  label: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
});

export type PermissionQueryParamsDto = z.infer<
  typeof PermissionQueryParamsSchema
>;
export type UpdatePermissionDto = z.infer<typeof UpdatePermissionSchema>;
