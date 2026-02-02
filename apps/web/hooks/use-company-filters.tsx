import type { CompanyFilters, CompanyParams } from "@workspace/shared/types/company";
import { useFilters } from "./use-filters";

function transformFiltersToParams(filters?: CompanyFilters): CompanyParams {
  if (!filters) return {};

  return {
    ...filters,
  };
}

interface Props {
  initialValues?: CompanyFilters;
  debounce?: number;
}

export function useCompanyFilters(props?: Props) {
  return useFilters<CompanyFilters, CompanyParams>({
    initialValues: props?.initialValues,
    debounce: props?.debounce,
    transformFilters: transformFiltersToParams,
  });
}
