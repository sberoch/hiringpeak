import type { PaginationFilters } from "./api";

export type BaseIndustry = {
  name: string;
};

export type Industry = BaseIndustry & {
  id: number;
};

export type IndustryParams = PaginationFilters & {
  name?: string;
};

export type CreateIndustryDto = BaseIndustry;
export type UpdateIndustryDto = Partial<BaseIndustry>;
