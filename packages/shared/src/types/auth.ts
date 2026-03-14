export type AuthLogin = {
  access_token: string;
};

export type AuthTokenData = {
  active: boolean;
  iat: number;
  id: number;
  email?: string;
  name: string;
  /** Role id for tenant RBAC; null for INTERNAL_USER or no role. */
  roleId: number | null;
  /** Present for org users; absent/null for INTERNAL_USER */
  organizationId?: number | null;
};
