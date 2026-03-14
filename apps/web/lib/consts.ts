export const REDIRECT_AUTHORIZED = "/candidates";
export const REDIRECT_UNAUTHORIZED = "/login";

/** Path patterns that require authentication (any authenticated user). API enforces permissions. */
export const PAGE_AUTHORIZATION_ACCESS: Record<string, true> = {
  "/candidates": true,
  "/candidates/:id": true,
  "/candidates/:id/edit": true,
  "/candidates/new": true,
  "/companies": true,
  "/companies/new": true,
  "/dashboard": true,
  "/settings": true,
  "/organization-settings": true,
  "/organization-settings/users": true,
  "/organization-settings/roles": true,
  "/organization-settings/audit-log": true,
  "/users": true,
  "/users/new": true,
  "/vacancies": true,
  "/vacancies/:id": true,
  "/vacancies/:id/candidate-selection": true,
  "/vacancies/new": true,
  "/vacancies/new/candidate-selection": true,
} as const;

export enum DialogsIdsEnum {
  simulateVacancy = "simulateVacancy",
}
