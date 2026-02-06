import type { PaginatedResponse as SharedPaginatedResponse } from "./pagination.js";

type OrderDirection = "asc" | "desc";
type OrderString<T> = T extends undefined
  ? string
  : { [K in keyof T]: `${string & K}:${OrderDirection}` }[keyof T];

export type PaginatedResponse<T> = SharedPaginatedResponse<T>;

export type PaginationFilters<T = undefined> = {
  limit?: number;
  page?: number;
  order?: OrderString<T>;
};
