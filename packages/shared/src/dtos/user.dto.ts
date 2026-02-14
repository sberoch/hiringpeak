import { z } from "zod";
import { UserRole } from "../enums.js";
import { passwordSchema } from "../lib/password.schema.js";
import { PaginationParamsSchema } from "./pagination.dto.js";

const CreateUserSchemaBase = z.object({
  organizationId: z.number().nullable(),
  email: z.email(),
  password: passwordSchema,
  name: z.string().min(1),
  role: z
    .enum([
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.BASIC,
      UserRole.SYSTEM_ADMIN,
    ] as const)
    .default(UserRole.BASIC),
  roleId: z.number().int().positive().optional(),
  active: z.boolean().optional(),
});

const organizationIdRefinement = (data: any) => ({
  condition: data.organizationId === undefined && data.role !== UserRole.SYSTEM_ADMIN,
  params: {
    message: "Organization ID is required for non system admin users",
    path: ["organizationId"],
  },
});

export const CreateUserSchema = CreateUserSchemaBase.refine(
  (data) => organizationIdRefinement(data).condition,
  organizationIdRefinement({}).params
);

export const UpdateUserSchema = CreateUserSchemaBase.partial().refine(
  (data) => organizationIdRefinement(data).condition,
  organizationIdRefinement({}).params
);

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
