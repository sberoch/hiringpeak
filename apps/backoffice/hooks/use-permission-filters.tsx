import type { PermissionParams } from "@/lib/api/permission";
import type { PaginationFilters } from "@workspace/shared/types/api";
import { useFilters } from "./use-filters";

type PermissionFilters = PaginationFilters & {
  code?: string;
  label?: string;
};

function transformFiltersToParams(
  filters?: PermissionFilters
): PermissionParams {
  if (!filters) return {};
  return { ...filters };
}

interface Props {
  initialValues?: PermissionFilters;
  debounce?: number;
}

export function usePermissionFilters(props?: Props) {
  return useFilters<PermissionFilters, PermissionParams>({
    initialValues: props?.initialValues,
    debounce: props?.debounce,
    transformFilters: transformFiltersToParams,
  });
}
