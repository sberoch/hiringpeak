import type { PaginationFilters } from "./api";
import type { User } from "../schemas/user.schema";

export type { User };

export type PasswordlessUser = Omit<User, "password">;

/** User without password, with organizationId explicitly nullable (e.g. for findById return). */
export type UserPublic = Omit<User, "password"> & { organizationId: number | null };

export type CreateUserDto = User & {
  password: string;
};
export type UpdateUserDto = PasswordlessUser;

export type UserFilters = PaginationFilters & {
  email?: string;
  name?: string;
  active?: boolean;
  roleId?: number;
  excludeRoleId?: number;
};

export type UserParams = UserFilters;
