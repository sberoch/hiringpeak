import { z } from "zod";
import { UserRole } from "../enums.js";
import { PaginationParamsSchema } from "./pagination.dto.js";

export const CreateUserSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z
    .enum([UserRole.ADMIN, UserRole.MANAGER, UserRole.BASIC] as const)
    .default(UserRole.BASIC),
  active: z.boolean().optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial();

export const UserQueryParamsSchema = PaginationParamsSchema.extend({
  email: z.string().optional(),
  name: z.string().optional(),
  active: z
    .union([z.boolean(), z.string().transform((v) => v === "true")])
    .optional(),
  role: z
    .enum([UserRole.ADMIN, UserRole.MANAGER, UserRole.BASIC] as const)
    .optional(),
  excludeRole: z
    .enum([UserRole.ADMIN, UserRole.MANAGER, UserRole.BASIC] as const)
    .optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type UserQueryParamsDto = z.infer<typeof UserQueryParamsSchema>;
