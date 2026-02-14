import { UserRoleEnum } from "@workspace/shared/types/user";

export const REDIRECT_AUTHORIZED = "/candidates";
export const REDIRECT_UNAUTHORIZED = "/login";

export const PAGE_AUTHORIZATION_ACCESS: Record<string, UserRoleEnum[]> = {
  "/candidates": [UserRoleEnum.ADMIN, UserRoleEnum.MANAGER, UserRoleEnum.BASIC],
  "/candidates/:id": [
    UserRoleEnum.ADMIN,
    UserRoleEnum.MANAGER,
    UserRoleEnum.BASIC,
  ],
  "/candidates/:id/edit": [
    UserRoleEnum.ADMIN,
    UserRoleEnum.MANAGER,
    UserRoleEnum.BASIC,
  ],
  "/candidates/new": [
    UserRoleEnum.ADMIN,
    UserRoleEnum.MANAGER,
    UserRoleEnum.BASIC,
  ],
  "/companies": [UserRoleEnum.ADMIN, UserRoleEnum.MANAGER, UserRoleEnum.BASIC],
  "/companies/new": [
    UserRoleEnum.ADMIN,
    UserRoleEnum.MANAGER,
    UserRoleEnum.BASIC,
  ],
  "/dashboard": [UserRoleEnum.ADMIN, UserRoleEnum.MANAGER, UserRoleEnum.BASIC],
  "/settings": [UserRoleEnum.ADMIN],
  "/organization-settings": [UserRoleEnum.ADMIN],
  "/organization-settings/users": [UserRoleEnum.ADMIN, UserRoleEnum.MANAGER],
  "/organization-settings/roles": [UserRoleEnum.ADMIN],
  "/users": [UserRoleEnum.ADMIN, UserRoleEnum.MANAGER],
  "/users/new": [UserRoleEnum.ADMIN],
  "/vacancies": [UserRoleEnum.ADMIN, UserRoleEnum.MANAGER, UserRoleEnum.BASIC],
  "/vacancies/:id": [
    UserRoleEnum.ADMIN,
    UserRoleEnum.MANAGER,
    UserRoleEnum.BASIC,
  ],
  "/vacancies/:id/candidate-selection": [
    UserRoleEnum.ADMIN,
    UserRoleEnum.MANAGER,
    UserRoleEnum.BASIC,
  ],
  "/vacancies/new": [
    UserRoleEnum.ADMIN,
    UserRoleEnum.MANAGER,
    UserRoleEnum.BASIC,
  ],
  "/vacancies/new/candidate-selection": [
    UserRoleEnum.ADMIN,
    UserRoleEnum.MANAGER,
    UserRoleEnum.BASIC,
  ],
} as const;

export enum DialogsIdsEnum {
  simulateVacancy = "simulateVacancy",
}
