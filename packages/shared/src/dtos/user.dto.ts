import { z } from "zod";
import { passwordSchema } from "../lib/password.schema.js";
import { PaginationParamsSchema } from "./pagination.dto.js";

const CreateUserSchemaBase = z.object({
  organizationId: z.number().nullable(),
  email: z.email(),
  password: passwordSchema,
  name: z.string().min(1),
  roleId: z.number().int().positive().optional(),
  active: z.boolean().optional(),
});

/** Organization ID is required when roleId is set (tenant user). */
const organizationIdRefinement = (data: any) => ({
  condition:
    data.roleId == null ||
    (data.organizationId !== undefined && data.organizationId !== null),
  params: {
    message: "Organization ID is required when role is assigned",
    path: ["organizationId"],
  },
});

export const CreateUserSchema = CreateUserSchemaBase.refine(
  (data) => organizationIdRefinement(data).condition,
  organizationIdRefinement({}).params
);

/** Update: no refinement (organizationId comes from route context). */
export const UpdateUserSchema = CreateUserSchemaBase.partial();

export const UserQueryParamsSchema = PaginationParamsSchema.extend({
  email: z.string().optional(),
  name: z.string().optional(),
  active: z
    .union([z.boolean(), z.string().transform((v) => v === "true")])
    .optional(),
  roleId: z.coerce.number().int().positive().optional(),
  excludeRoleId: z.coerce.number().int().positive().optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type UserQueryParamsDto = z.infer<typeof UserQueryParamsSchema>;
