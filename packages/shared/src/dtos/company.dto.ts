import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto.js";
import { CompanyStatus } from "../enums.js";

export const CreateCompanySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  status: z.nativeEnum(CompanyStatus),
});

export const UpdateCompanySchema = CreateCompanySchema.partial();

export const CompanyQueryParamsSchema = PaginationParamsSchema.extend({
  id: z.coerce.number().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.nativeEnum(CompanyStatus).optional(),
});

export type CreateCompanyDto = z.infer<typeof CreateCompanySchema>;
export type UpdateCompanyDto = z.infer<typeof UpdateCompanySchema>;
export type CompanyQueryParamsDto = z.infer<typeof CompanyQueryParamsSchema>;
