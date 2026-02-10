export const UserRole = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  BASIC: "BASIC",
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export enum CompanyStatus {
  ACTIVE = "Active",
  PROSPECT = "Prospect",
}
