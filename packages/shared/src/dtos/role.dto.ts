import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto.js";

export const CreateRoleSchema = z.object({
  name: z.string().min(1),
  permissionIds: z.array(z.number().int().positive()).optional(),
});

export const UpdateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  permissionIds: z.array(z.number().int().positive()).optional(),
});

export const RoleQueryParamsSchema = PaginationParamsSchema.extend({
  name: z.string().optional(),
});

export type CreateRoleDto = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleDto = z.infer<typeof UpdateRoleSchema>;
export type RoleQueryParamsDto = z.infer<typeof RoleQueryParamsSchema>;
