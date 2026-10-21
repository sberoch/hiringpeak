import { z } from "zod";
import {
  ACCENT_COLOR_FORMAT_MESSAGE,
  ACCENT_COLOR_PATTERN,
} from "../lib/accent-color";

/** Setting the logo: the downscaled copy and the original it came from. */
export const UpdateBrandingLogoSchema = z.object({
  logoUrl: z.url(),
  originalLogoUrl: z.url(),
});

export type UpdateBrandingLogoDto = z.infer<typeof UpdateBrandingLogoSchema>;

/** Setting the accent color for the client-facing PDFs. */
export const UpdateBrandingAccentSchema = z.object({
  accentColor: z
    .string()
    .regex(ACCENT_COLOR_PATTERN, ACCENT_COLOR_FORMAT_MESSAGE),
});

export type UpdateBrandingAccentDto = z.infer<
  typeof UpdateBrandingAccentSchema
>;
