export const REDIRECT_AUTHORIZED = "/organizations";
export const REDIRECT_UNAUTHORIZED = "/login";

/** Routes restricted to internal (backoffice) users. Presence in this set
 *  triggers the organizationId==null check in hasAccessToRoute. */
export const PAGE_AUTHORIZATION_ACCESS: Record<string, true> = {
  "/organizations": true,
  "/organizations/new": true,
  "/permissions": true,
};
