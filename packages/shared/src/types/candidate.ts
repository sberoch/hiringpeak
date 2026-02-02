import type { PaginationFilters } from "./api.js";
import type { Area } from "./area.js";
import type { Comment } from "./comment.js";
import type { Industry } from "./industry.js";
import type { Seniority } from "./seniority.js";
import type { Vacancy } from "./vacancy.js";

export type BaseCandidateSource = {
  name: string;
};

export type CandidateSource = BaseCandidateSource & {
  id: number;
};

export type BaseCandidateFile = {
  name: string;
  url: string;
};

export type CandidateFile = BaseCandidateFile & {
  id: number;
};

export type CandidateBlacklistReason = {
  id: number;
  candidateId: number;
  reason: string;
  createdAt: string;
  userId: number;
};

export type BaseCandidate = {
  name: string;
  image?: string;
  dateOfBirth?: string;
  gender: string;
  shortDescription?: string;
  email?: string;
  linkedin?: string;
  address?: string;
  phone?: string;
  source?: CandidateSource;
  seniorities: Seniority[];
  areas: Area[];
  industries: Industry[];
  files: BaseCandidateFile[];
  countries: string[];
  provinces?: string[];
  languages?: string[];
};

export type Candidate = Omit<
  BaseCandidate,
  "seniorities" | "areas" | "industries" | "files"
> & {
  id: number;
  stars: number;
  isInCompanyViaPratt: boolean;
  blacklist?: CandidateBlacklistReason;
  seniorities: Seniority[];
  areas: Area[];
  industries: Industry[];
  files: CandidateFile[];
  vacancies: Vacancy[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
};

export type CreateCandidateDto = Omit<
  BaseCandidate,
  "seniorities" | "areas" | "industries" | "files" | "source"
> & {
  seniorityIds: number[];
  areaIds: number[];
  industryIds: number[];
  sourceId: number;
  fileIds: number[];
  stars: number;
  isInCompanyViaPratt: boolean;
};

export type UpdateCandidateDto = Partial<CreateCandidateDto>;

export type CandidateParams = PaginationFilters & {
  name?: string;
  image?: string;
  minimumAge?: number;
  maximumAge?: number;
  gender?: string;
  shortDescription?: string;
  email?: string;
  linkedin?: string;
  address?: string;
  phone?: string;
  seniorityIds?: number[];
  areaIds?: number[];
  industryIds?: number[];
  sourceId?: number;
  minimumStars?: number;
  maximumStars?: number;
  blacklisted?: boolean;
  isInCompanyViaPratt?: boolean;
  deleted?: boolean;
  countries?: string[];
  provinces?: string[];
  languages?: string[];
};

export type CandidateFilters = PaginationFilters &
  Omit<CandidateParams, "seniorityIds" | "industryIds" | "areaIds"> & {
    seniorities?: Seniority[];
    industries?: Industry[];
    areas?: Area[];
  };
