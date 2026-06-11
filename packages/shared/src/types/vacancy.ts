import type { PaginationFilters } from "./api.js";
import type { Area } from "./area.js";
import type { Candidate } from "./candidate.js";
import type { Company } from "./company.js";
import type { Industry } from "./industry.js";
import type { Seniority } from "./seniority.js";
import type { User } from "./user.js";
import type { VacancyStatus } from "./vacancy-status.js";
import type { CandidateVacancyStatus } from "./candidate-vacancy-status.js";
import type { RejectionReason } from "./rejection-reason.js";

export type BaseCandidateVacancy = {
  status: CandidateVacancyStatus;
  notes?: string;
  rejectionReasonId?: number | null;
  rejectionReason?: RejectionReason | null;
  rejectionNote?: string | null;
};

export type CandidateVacancy = BaseCandidateVacancy & {
  id: number;
  candidate: Candidate;
  vacancy: Vacancy;
  createdAt: Date;
  updatedAt: Date;
};

export type CandidateVacancyParams = PaginationFilters & {
  candidateId?: number;
  candidateIds?: number[];
  vacancyId?: number;
  candidateVacancyStatusId?: number;
  rejectionReasonId?: number;
};

export type CreateCandidateVacancyDto = BaseCandidateVacancy & {
  candidateId: number;
};

export type UpdateCandidateVacancyDto = Partial<CreateCandidateVacancyDto>;

export type BaseVacancyFilters = PaginationFilters & {
  seniorityIds?: number[];
  areaIds?: number[];
  industryIds?: number[];
  minStars?: number;
  gender?: string;
  minAge?: number;
  maxAge?: number;
  countries?: string[];
  provinces?: string[];
  languages?: string[];
  title?: string;
};

export type VacancyFiltersType = Omit<
  BaseVacancyFilters,
  "seniorityIds" | "areaIds" | "industryIds"
> & {
  seniorities?: Seniority[];
  areas?: Area[];
  industries?: Industry[];
  status?: VacancyStatus;
  company?: Company;
  createdBy?: number;
  assignedTo?: number;
  search?: string;
};

export type BaseVacancy = {
  title: string;
  description?: string;
  salary?: string | null;
  status: VacancyStatus;
  filters?: BaseVacancyFilters;
  createdBy?: User["id"] | string;
  assignedTo?: User["id"] | string;
};

export type ListedCandidateVacancy = Omit<CandidateVacancy, "vacancy"> & {
  vacancyId: Vacancy["id"];
};

export type Vacancy = Omit<
  BaseVacancy,
  "filters" | "createdBy" | "assignedTo"
> & {
  id: number;
  company: Company;
  filters: VacancyFiltersType;
  candidates: ListedCandidateVacancy[];
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: User;
  assignedTo: User;
};

/** Slim candidacy carried by the list endpoint: enough for avatars + status chips. */
export type VacancyListCandidacy = {
  id: number;
  candidate: Pick<Candidate, "id" | "name" | "image">;
  status: Pick<CandidateVacancyStatus, "id" | "name">;
};

export type VacancyStatusCount = {
  name: string;
  count: number;
};

/**
 * Shape served by GET /vacancy (the list). Instead of the full `candidates`
 * graph it carries aggregates plus the newest few candidacies; screens that
 * need every candidacy fetch the vacancy by id.
 */
export type VacancyListItem = Omit<Vacancy, "candidates"> & {
  candidateCount: number;
  candidateStatusCounts: VacancyStatusCount[];
  recentCandidates: VacancyListCandidacy[];
};

export type VacancyParams = PaginationFilters & {
  title?: string;
  statusId?: number;
  companyId?: number;
  filterSeniorityIds?: number[];
  filterIndustryIds?: number[];
  filterAreaIds?: number[];
  filterMinStars?: number;
  filterGender?: string;
  filterMinAge?: number;
  filterMaxAge?: number;
  filterCountries?: string[];
  filterProvinces?: string[];
  filterLanguages?: string[];
  createdById?: number;
  assignedToId?: number;
};
