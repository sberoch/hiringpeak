"use client";

import { useQuery } from "@tanstack/react-query";

import { DataTable } from "@workspace/ui/components/data-table";
import { useVacancyFilters } from "@/hooks/use-vacancy-filters";
import { getAllVacancies, VACANCY_API_KEY } from "@/lib/api/vacancy";
import type { PaginatedResponse } from "@workspace/shared/types/api";
import type { Vacancy, VacancyFiltersType } from "@workspace/shared/types/vacancy";
import { VacancyFilters } from "./vacancy-filters";
import { columns } from "./vacancy-table-columns";

interface VacancyTableProps {
  initialFilters?: VacancyFiltersType;
}

export const VacancyTable = ({ initialFilters }: VacancyTableProps) => {
  const {
    filters,
    params,
    resetFilters,
    setFilters,
    onPaginationChange,
    onSortingChange,
  } = useVacancyFilters({
    initialValues: {
      limit: 10,
      page: 1,
      order: "id:desc",
      ...initialFilters,
    },
  });

  const { data, isLoading } = useQuery<PaginatedResponse<Vacancy>>({
    queryKey: [VACANCY_API_KEY, params],
    queryFn: () => getAllVacancies(params),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  return (
    <div className="w-full flex flex-col gap-4 pb-4 mt-4 mb-12">
      <VacancyFilters
        filters={filters}
        onFiltersChange={setFilters}
        resetFilters={resetFilters}
      />
      <DataTable
        columns={columns}
        data={data?.items || []}
        loading={isLoading}
        pagination={{
          totalItems: data?.meta.totalItems || 1,
          pageCount: data?.meta.totalPages || 1,
          pageIndex: (filters.page || 1) - 1,
          pageSize: filters.limit || 10,
          onPaginationChange,
        }}
        sorting={{
          order: filters.order,
          onSortingChange,
        }}
      />
    </div>
  );
};
