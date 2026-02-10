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
  /** Present for org users; absent/null for SYSTEM_ADMIN */
  organizationId?: number | null;
};
