import type { UserRoleEnum } from "./user.js";

export type AuthLogin = {
  access_token: string;
};

export type AuthTokenData = {
  active: boolean;
  iat: number;
  id: number;
  email?: string;
  role: UserRoleEnum;
  name: string;
  /** Role id for tenant RBAC; null for SYSTEM_ADMIN or no role. */
  roleId: number | null;
  /** Present for org users; absent/null for SYSTEM_ADMIN */
  organizationId?: number | null;
};
