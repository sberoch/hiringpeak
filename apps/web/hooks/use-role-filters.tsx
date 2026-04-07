import type { RoleParams } from "@/lib/api/role";
import { useFilters } from "./use-filters";

export interface RoleFilters {
  page?: number;
  limit?: number;
  order?: string;
  name?: string;
}

function transformFiltersToParams(filters?: RoleFilters): RoleParams {
  if (!filters) return {};
  return { ...filters };
}

interface Props {
  initialValues?: RoleFilters;
  debounce?: number;
}

export function useRoleFilters(props?: Props) {
  return useFilters<RoleFilters, RoleParams>({
    initialValues: props?.initialValues,
    debounce: props?.debounce,
    transformFilters: transformFiltersToParams,
  });
}
