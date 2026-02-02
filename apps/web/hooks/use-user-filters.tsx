import type { UserFilters, UserParams } from "@workspace/shared/types/user";
import { useFilters } from "./use-filters";

function transformFiltersToParams(filters?: UserFilters): UserParams {
  if (!filters) return {};

  return {
    ...filters,
  };
}

interface Props {
  initialValues?: UserFilters;
  debounce?: number;
}

export function useUserFilters(props?: Props) {
  return useFilters<UserFilters, UserParams>({
    initialValues: props?.initialValues,
    debounce: props?.debounce,
    transformFilters: transformFiltersToParams,
  });
}
