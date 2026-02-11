import { z } from "zod";

const MIN_LENGTH = 8;
const HAS_UPPER = /[A-Z]/;
const HAS_LOWER = /[a-z]/;
const HAS_NUMBER = /\d/;
const HAS_SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

export function getPasswordRequirementResults(password: string): {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
} {
  return {
    length: password.length >= MIN_LENGTH,
    upper: HAS_UPPER.test(password),
    lower: HAS_LOWER.test(password),
    number: HAS_NUMBER.test(password),
    special: HAS_SPECIAL.test(password),
  };
}

export const passwordSchema = z
  .string()
  .min(MIN_LENGTH, "Password must be at least 8 characters")
  .refine((s) => HAS_UPPER.test(s), "Password must contain at least one uppercase letter")
  .refine((s) => HAS_LOWER.test(s), "Password must contain at least one lowercase letter")
  .refine((s) => HAS_NUMBER.test(s), "Password must contain at least one number")
  .refine((s) => HAS_SPECIAL.test(s), "Password must contain at least one special character");

export type Password = z.infer<typeof passwordSchema>;

export const PASSWORD_REQUIREMENT_LABELS = {
  length: "At least 8 characters",
  upper: "One uppercase letter",
  lower: "One lowercase letter",
  number: "One number",
  special: "One special character",
} as const;
