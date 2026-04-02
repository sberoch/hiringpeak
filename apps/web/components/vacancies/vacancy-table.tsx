"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { DataTable } from "@workspace/ui/components/data-table";
import { Input } from "@workspace/ui/components/input";
import { useVacancyFilters } from "@/hooks/use-vacancy-filters";
import { getAllVacancies, VACANCY_API_KEY } from "@/lib/api/vacancy";
import type { PaginatedResponse } from "@workspace/shared/types/api";
import type { Vacancy, VacancyFiltersType } from "@workspace/shared/types/vacancy";
import {
  ActiveVacancyFilterChips,
  useActiveVacancyFilterCount,
  VacancyFilterPanel,
} from "./vacancy-filter-panel";
import { columns } from "./vacancy-table-columns";

interface VacancyTableProps {
  initialFilters?: VacancyFiltersType;
}

export const VacancyTable = ({ initialFilters }: VacancyTableProps) => {
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const activeFilterCount = useActiveVacancyFilterCount(filters);

  return (
    <>
      {/* Toolbar: search + filters button */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-brand" />
          <Input
            type="search"
            placeholder="Buscar por nombre o número..."
            className="pl-9 rounded-xl border-brand-border bg-surface focus:border-electric focus:ring-electric/10 placeholder:text-muted-brand"
            value={filters.title}
            onChange={(e) =>
              setFilters({ ...filters, title: e.target.value })
            }
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setFiltersOpen(true)}
          className="relative rounded-xl border-brand-border text-slate-brand hover:text-ink hover:border-electric hover:bg-electric/5 transition-all gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-electric text-[11px] font-bold text-white px-1.5">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="mb-4">
          <ActiveVacancyFilterChips
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>
      )}

      {/* Filter panel (slide-out sheet) */}
      <VacancyFilterPanel
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onFiltersChange={setFilters}
        resetFilters={resetFilters}
      />

      {/* Table */}
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
    </>
  );
};
