import { UserRoleEnum } from "@workspace/shared/types/user";

export const REDIRECT_AUTHORIZED = "/organizations";
export const REDIRECT_UNAUTHORIZED = "/login";

export const PAGE_AUTHORIZATION_ACCESS: Record<string, UserRoleEnum[]> = {
  "/organizations": [UserRoleEnum.SYSTEM_ADMIN],
  "/organizations/new": [UserRoleEnum.SYSTEM_ADMIN],
  "/permissions": [UserRoleEnum.SYSTEM_ADMIN],
} as const;
