import { UserRole } from "../enums.js";
import { PaginationParams } from "../types/pagination.js";
import { Entity } from "./entity.js";

export interface User extends Entity {
  email: string;
  password: string;
  role: UserRole;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  active?: boolean;
}

export interface UpdateUserDto extends Partial<CreateUserDto> {
  lastLogin?: Date;
}

export interface UserQueryParams extends PaginationParams {
  email?: string;
  name?: string;
  role?: UserRole;
  active?: boolean;
  excludeRole?: UserRole;
}
