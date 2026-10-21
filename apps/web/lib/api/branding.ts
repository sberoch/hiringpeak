import type { UpdateBrandingLogoDto } from "@workspace/shared/dtos";
import type { Branding } from "@workspace/shared/types/branding";

import api from ".";

export const BRANDING_API_KEY = "branding";

/** The current Organization's Branding. */
export async function getBranding() {
  const response = await api.get<Branding>("/branding");
  return response.data;
}

export async function updateBrandingLogo(logo: UpdateBrandingLogoDto) {
  const response = await api.patch<Branding>("/branding/logo", logo);
  return response.data;
}

export async function removeBrandingLogo() {
  const response = await api.delete<Branding>("/branding/logo");
  return response.data;
}
