import { useCallback, useMemo, useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import { PaginationState, SortingState, Updater } from "@tanstack/react-table";

import type { PaginationFilters } from "@workspace/shared/types/api";

interface UseFiltersProps<TFilters extends PaginationFilters, TParams> {
  initialValues?: TFilters;
  debounce?: number;
  transformFilters: (filters?: TFilters) => TParams;
}

function generateInitialValues<TFilters extends PaginationFilters>(
  initialValues?: TFilters
): TFilters {
  return {
    ...initialValues,
    page: initialValues?.page ?? 1,
    limit: initialValues?.limit ?? 10,
    order: initialValues?.order ?? "id:desc",
  } as TFilters;
}

export function useFilters<TFilters extends PaginationFilters, TParams>({
  initialValues,
  debounce = 400,
  transformFilters,
}: UseFiltersProps<TFilters, TParams>) {
  const [filters, setFilters] = useState<TFilters>(() =>
    generateInitialValues(initialValues)
  );

  const debouncedFilters = useDebounce(filters, debounce);
  const params = useMemo(
    () => transformFilters(debouncedFilters),
    [debouncedFilters, transformFilters]
  );

  const onPaginationChange = useCallback(
    (updaterOrValue: Updater<PaginationState>) => {
      if (typeof updaterOrValue === "function") {
        const newPagination = updaterOrValue({
          pageIndex: (filters.page ?? 1) - 1,
          pageSize: filters.limit ?? 10,
        });
        void setFilters((prev) => ({
          ...prev,
          page: newPagination.pageIndex + 1,
        }));
      } else {
        void setFilters((prev) => ({
          ...prev,
          page: updaterOrValue.pageIndex + 1,
        }));
      }
    },
    [filters.page, filters.limit, setFilters]
  );

  const onSortingChange = useCallback(
    (updaterOrValue: Updater<SortingState>) => {
      if (typeof updaterOrValue === "function") {
        const currentSort = filters.order
          ? {
            id: filters.order.split(":")[0],
            desc: filters.order.split(":")[1] === "desc",
          }
          : undefined;
        const newSorting = updaterOrValue(currentSort ? [currentSort] : []);
        const orderString = newSorting[0]
          ? `${newSorting[0].id}:${newSorting[0].desc ? "desc" : "asc"}`
          : "";

        void setFilters((prev) => ({
          ...prev,
          order: orderString,
        }));
      } else {
        const orderString = updaterOrValue[0]
          ? `${updaterOrValue[0].id}:${updaterOrValue[0].desc ? "desc" : "asc"}`
          : "";

        void setFilters((prev) => ({
          ...prev,
          order: orderString,
        }));
      }
    },
    [filters.order, setFilters]
  );

  return {
    filters,
    setFilters,
    resetFilters: () => setFilters(generateInitialValues(initialValues)),
    onPaginationChange,
    onSortingChange,
    params,
  };
}
