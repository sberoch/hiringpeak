import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto";
import { CompanyStatus } from "../enums";

export const CreateCompanySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
});

export const UpdateCompanySchema = CreateCompanySchema.partial();

/** Set or clear (`null`) a Company's Account Owner. Requires `CRM_MANAGE`. */
export const UpdateCompanyAccountOwnerSchema = z.object({
  accountOwnerId: z.number().int().nullable(),
});

export const CompanyQueryParamsSchema = PaginationParamsSchema.extend({
  id: z.coerce.number().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  /** Derived Company Status: Prospect or Client. */
  status: z.nativeEnum(CompanyStatus).optional(),
  /** "Mis cuentas": Companies whose Account Owner is this User. */
  accountOwnerId: z.coerce.number().int().optional(),
});

export type CreateCompanyDto = z.infer<typeof CreateCompanySchema>;
export type UpdateCompanyDto = z.infer<typeof UpdateCompanySchema>;
export type UpdateCompanyAccountOwnerDto = z.infer<
  typeof UpdateCompanyAccountOwnerSchema
>;
export type CompanyQueryParamsDto = z.infer<typeof CompanyQueryParamsSchema>;
