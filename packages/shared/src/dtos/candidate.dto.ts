import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto.js";

export const CreateCandidateSchema = z.object({
  name: z.string().min(2),
  image: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.string().min(1),
  shortDescription: z.string().optional().or(z.literal("")),
  email: z.email(),
  linkedin: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  sourceId: z.number().int(),
  seniorityIds: z.array(z.number().int()),
  areaIds: z.array(z.number().int()),
  industryIds: z.array(z.number().int()),
  fileIds: z.array(z.number().int()),
  stars: z.number(),
  isInCompanyViaPratt: z.boolean(),
  countries: z.array(z.string()),
  provinces: z.array(z.string()),
  languages: z.array(z.string()),
});

export const UpdateCandidateSchema = CreateCandidateSchema.partial();

export const BlacklistCandidateSchema = z.object({
  reason: z.string().min(1),
});

export const CandidateQueryParamsSchema = PaginationParamsSchema.extend({
  id: z.coerce.number().optional(),
  name: z.string().optional(),
  minimumAge: z.coerce.number().optional(),
  maximumAge: z.coerce.number().optional(),
  gender: z.string().optional(),
  shortDescription: z.string().optional(),
  email: z.string().optional(),
  linkedin: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  countries: z
    .union([z.array(z.string()), z.string().transform((v) => [v])])
    .optional(),
  provinces: z
    .union([z.array(z.string()), z.string().transform((v) => [v])])
    .optional(),
  languages: z
    .union([z.array(z.string()), z.string().transform((v) => [v])])
    .optional(),
  sourceId: z.coerce.number().optional(),
  seniorityIds: z
    .union([
      z.array(z.coerce.number()),
      z.coerce.number().transform((v) => [v]),
    ])
    .optional(),
  areaIds: z
    .union([
      z.array(z.coerce.number()),
      z.coerce.number().transform((v) => [v]),
    ])
    .optional(),
  industryIds: z
    .union([
      z.array(z.coerce.number()),
      z.coerce.number().transform((v) => [v]),
    ])
    .optional(),
  fileIds: z
    .union([
      z.array(z.coerce.number()),
      z.coerce.number().transform((v) => [v]),
    ])
    .optional(),
  minimumStars: z.coerce.number().optional(),
  maximumStars: z.coerce.number().optional(),
  blacklisted: z
    .union([z.boolean(), z.string().transform((v) => v === "true")])
    .optional(),
  deleted: z
    .union([z.boolean(), z.string().transform((v) => v === "true")])
    .optional(),
  isInCompanyViaPratt: z
    .union([z.boolean(), z.string().transform((v) => v === "true")])
    .optional(),
});

export type CreateCandidateDto = z.infer<typeof CreateCandidateSchema>;
export type UpdateCandidateDto = z.infer<typeof UpdateCandidateSchema>;
export type BlacklistCandidateDto = z.infer<typeof BlacklistCandidateSchema>;
export type CandidateQueryParamsDto = z.infer<
  typeof CandidateQueryParamsSchema
>;
