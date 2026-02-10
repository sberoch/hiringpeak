import type { OrganizationParams } from "@/lib/api/organization";
import type { PaginationFilters } from "@workspace/shared/types/api";
import { useFilters } from "./use-filters";

type OrganizationFilters = PaginationFilters & {
  name?: string;
};

function transformFiltersToParams(filters?: OrganizationFilters): OrganizationParams {
  if (!filters) return {};
  return {
    ...filters,
  };
}

interface Props {
  initialValues?: OrganizationFilters;
  debounce?: number;
}

export function useOrganizationFilters(props?: Props) {
  return useFilters<OrganizationFilters, OrganizationParams>({
    initialValues: props?.initialValues,
    debounce: props?.debounce,
    transformFilters: transformFiltersToParams,
  });
}
