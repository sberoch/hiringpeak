export const UserRole = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  BASIC: "BASIC",
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Internal-only: used for auth origin (web vs backoffice). Never expose via API. */
export const UserType = {
  END_USER: "END_USER",
  INTERNAL_USER: "INTERNAL_USER",
} as const;
export type UserType = (typeof UserType)[keyof typeof UserType];

/** Immutable permission codes. Seeded in DB; used for RBAC checks. */
export const PermissionCode = {
  CANDIDATE_READ: "CANDIDATE_READ",
  CANDIDATE_MANAGE: "CANDIDATE_MANAGE",
  VACANCY_READ: "VACANCY_READ",
  VACANCY_MANAGE: "VACANCY_MANAGE",
  USER_READ: "USER_READ",
  USER_MANAGE: "USER_MANAGE",
  ROLE_MANAGE: "ROLE_MANAGE",
  COMPANY_READ: "COMPANY_READ",
  COMPANY_MANAGE: "COMPANY_MANAGE",
  AREA_READ: "AREA_READ",
  AREA_MANAGE: "AREA_MANAGE",
  SETTINGS_READ: "SETTINGS_READ",
  SETTINGS_MANAGE: "SETTINGS_MANAGE",
} as const;
export type PermissionCode =
  (typeof PermissionCode)[keyof typeof PermissionCode];

export enum CompanyStatus {
  ACTIVE = "Active",
  PROSPECT = "Prospect",
}
