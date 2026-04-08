import type { PaginationFilters } from "./api";
import { CompanyStatus } from "../enums";

export const CompanyStatusEnum = CompanyStatus;
export type CompanyStatusEnum = CompanyStatus;

export const COMPANY_STATUS_NAMES: Record<CompanyStatusEnum, string> = {
  [CompanyStatusEnum.ACTIVE]: "Activa",
  [CompanyStatusEnum.PROSPECT]: "Prospect",
} as const;

export type BaseCompany = {
  status: CompanyStatusEnum;
  name: string;
  description?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
};

export type Company = BaseCompany & {
  id: number;
  vacancyCount: number;
  createdAt: string | Date;
};

export type CompanyFilters = PaginationFilters & {
  name?: string;
  status?: CompanyStatusEnum;
};

export type CompanyParams = CompanyFilters;
