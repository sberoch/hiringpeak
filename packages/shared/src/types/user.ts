import type { PaginationFilters } from "./api";
import { UserRole } from "../enums";

export const UserRoleEnum = UserRole;
export type UserRoleEnum = UserRole;

export type BaseUser = {
  name: string;
  email: string;
  createdAt: string;
};

export type User = BaseUser & {
  role: UserRoleEnum;
  id: number;
};

export type CreateUserDto = BaseUser & {
  password: string;
};
export type UpdateUserDto = BaseUser;

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
