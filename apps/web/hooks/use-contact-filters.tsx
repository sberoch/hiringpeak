import type { ContactFilters } from "@workspace/shared/types/contact";
import { useFilters } from "./use-filters";

function transformFiltersToParams(filters?: ContactFilters): ContactFilters {
  if (!filters) return {};
  return { ...filters };
}

interface Props {
  initialValues?: ContactFilters;
  debounce?: number;
}

export function useContactFilters(props?: Props) {
  return useFilters<ContactFilters, ContactFilters>({
    initialValues: props?.initialValues,
    debounce: props?.debounce,
    transformFilters: transformFiltersToParams,
  });
}
