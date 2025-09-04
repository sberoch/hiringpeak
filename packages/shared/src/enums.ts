export const UserRole = {
  ADMIN: "ADMIN",
  BASIC: "BASIC",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
