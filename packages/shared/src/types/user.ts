import type { PaginationFilters } from "./api";
import { UserRole } from "../enums";
import type { User } from "../schemas/user.schema";

export type { User };
export const UserRoleEnum = UserRole;
export type UserRoleEnum = UserRole;

export type PasswordlessUser = Omit<User, "password">;

/** User without password, with organizationId explicitly nullable (e.g. for findById return). */
export type UserPublic = Omit<User, "password"> & { organizationId: number | null };

export type CreateUserDto = User & {
  password: string;
};
export type UpdateUserDto = PasswordlessUser;

export const ROLES_NAMES: Record<UserRoleEnum, string> = {
  [UserRoleEnum.ADMIN]: "Administrador",
  [UserRoleEnum.MANAGER]: "Manager",
  [UserRoleEnum.BASIC]: "Reclutador",
  [UserRoleEnum.SYSTEM_ADMIN]: "Administrador del sistema",
} as const;

export type UserFilters = PaginationFilters & {
  email?: string;
  name?: string;
  active?: boolean;
  role?: UserRoleEnum;
};

export type UserParams = UserFilters;
