import { z } from "zod";

/** Optional free text: blank becomes null. */
const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional();

/** A Contact created on a Company (the optional Company arrives with ticket 06). */
export const CreateContactSchema = z.object({
  companyId: z.number().int(),
  name: z.string().trim().min(1),
  role: z.string().trim().optional(),
  email: z
    .union([z.literal(""), z.string().trim().email()])
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional(),
  phone: optionalText,
  linkedin: optionalText,
});

/** Editing a Contact does not move them between Companies here. */
export const UpdateContactSchema = CreateContactSchema.omit({
  companyId: true,
}).partial();

export type CreateContactDto = z.infer<typeof CreateContactSchema>;
export type UpdateContactDto = z.infer<typeof UpdateContactSchema>;
