import type { PaginationFilters } from "./api.js";

export type BaseArea = {
  name: string;
};

export type Area = BaseArea & {
  id: number;
};

export type AreaFilters = PaginationFilters & {
  name?: string;
};

export type AreaParams = AreaFilters;

export type CreateAreaDto = BaseArea;
export type UpdateAreaDto = Partial<BaseArea>;
