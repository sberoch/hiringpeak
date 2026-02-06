"use client";

import { useQuery } from "@tanstack/react-query";

import { DataTable } from "@workspace/ui/components/data-table";
import type { PaginatedResponse } from "@workspace/shared/types/api";
import type { Vacancy } from "@workspace/shared/types/vacancy";
import { VACANCY_API_KEY, getAllVacancies } from "@/lib/api/vacancy";
import { dashboardColumns } from "./vacancy-table-columns";

export const VacancyTableHeadless = () => {
  const { data, isLoading } = useQuery<PaginatedResponse<Vacancy>>({
    queryKey: [VACANCY_API_KEY, { page: 1, limit: 5, order: "createdAt:desc" }],
    queryFn: () =>
      getAllVacancies({ page: 1, limit: 5, order: "createdAt:desc" }),
  });

  return (
    <div className="w-full flex flex-col gap-4 pb-4 mt-4">
      <DataTable
        columns={dashboardColumns}
        data={data?.items || []}
        loading={isLoading}
        hidePagination
      />
    </div>
  );
};
