import type { PaginationFilters } from "./api";
import { CompanyStatus } from "../enums";
import type { ContactView } from "./contact";
import type { LastInteraction } from "./interaction";

export const CompanyStatusEnum = CompanyStatus;
export type CompanyStatusEnum = CompanyStatus;

export const COMPANY_STATUS_NAMES: Record<CompanyStatusEnum, string> = {
  [CompanyStatusEnum.PROSPECT]: "Prospecto",
  [CompanyStatusEnum.CLIENT]: "Cliente",
} as const;

export type BaseCompany = {
  name: string;
  description?: string;
};

/** The commercial picture of a Company: only for viewers with commercial access. */
export type CompanyCommercialSummary = {
  openOpportunityCount: number;
  /** Sum of the open Opportunities' Estimated Fees (unestimated count as 0). */
  openOpportunityFee: number;
  lastInteraction: LastInteraction | null;
};

export type Company = BaseCompany & {
  id: number;
  /** Derived: Client once it has a won Opportunity or any Vacancy. */
  status: CompanyStatusEnum;
  accountOwnerId: number | null;
  accountOwner: { id: number; name: string } | null;
  vacancyCount: number;
  /** Vacancies whose status is not final. */
  activeVacancyCount: number;
  /** The Company's current Contacts, shaped for the viewer (see contactForViewer). */
  contacts: ContactView[];
  createdAt: string | Date;
  /** Present only for viewers with commercial access. */
  commercial?: CompanyCommercialSummary;
};

export type CompanyFilters = PaginationFilters & {
  name?: string;
  status?: CompanyStatusEnum;
  /** "Mis cuentas": Companies whose Account Owner is this User. */
  accountOwnerId?: number;
};

export type CompanyParams = CompanyFilters;
