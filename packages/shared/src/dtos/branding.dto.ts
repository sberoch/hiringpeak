import { z } from "zod";

/** Setting the logo: the downscaled copy and the original it came from. */
export const UpdateBrandingLogoSchema = z.object({
  logoUrl: z.url(),
  originalLogoUrl: z.url(),
});

export type UpdateBrandingLogoDto = z.infer<typeof UpdateBrandingLogoSchema>;
