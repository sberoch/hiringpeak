"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, SlidersHorizontal, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeading } from "@workspace/ui/components/page-heading";

import { Button } from "@workspace/ui/components/button";
import { DataTable } from "@workspace/ui/components/data-table";
import { Input } from "@workspace/ui/components/input";
import {
  ActiveFilterChips,
  CandidateFilterPanel,
  useActiveFilterCount,
} from "@/components/candidates/candidate-filter-panel";
import { columns } from "@/components/candidates/candidate-table-columns";
import { useCandidatesFilters } from "@/hooks/use-candidate-filters";
import { CANDIDATE_API_KEY, getAllCandidates } from "@/lib/api/candidate";
import {
  CANDIDATE_VACANCY_API_KEY,
  getCandidateVacancies,
} from "@/lib/api/candidate-vacancy";
import { mergeCandidatesWithVacancies } from "@/lib/utils";

export const CandidatesPage = () => {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    filters,
    params,
    resetFilters,
    setFilters,
    onPaginationChange,
    onSortingChange,
  } = useCandidatesFilters({
    initialValues: { limit: 50, order: "createdAt:desc" },
  });
  const { data, isLoading } = useQuery({
    queryKey: [CANDIDATE_API_KEY, params],
    queryFn: () => getAllCandidates(params),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const candidateIds = useMemo(() => {
    return data?.items.map((candidate) => candidate.id) || [];
  }, [data?.items]);

  const { data: candidateVacancies } = useQuery({
    queryKey: [CANDIDATE_VACANCY_API_KEY, candidateIds],
    queryFn: () => getCandidateVacancies({ candidateIds }),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const candidatesWithVacancies = useMemo(() => {
    if (!data?.items || !candidateVacancies?.items) {
      return data?.items || [];
    }
    return mergeCandidatesWithVacancies(data.items, candidateVacancies.items);
  }, [data?.items, candidateVacancies?.items]);

  const activeFilterCount = useActiveFilterCount(filters);

  return (
    <>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <PageHeading
          icon={Users}
          title="Postulantes"
          description="Gestiona y busca postulantes en tu base de datos."
        />
        <div className="flex items-center gap-3">
          <Link href="/candidates/new">
            <Button className="bg-electric hover:bg-electric-light text-white rounded-md font-semibold hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.3)] transition-all hover:-translate-y-0.5">
              <Plus className="h-4 w-4" />
              Nuevo Postulante
            </Button>
          </Link>
        </div>
      </div>

      {/* Toolbar: search + filters button */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-brand" />
          <Input
            type="search"
            placeholder="Buscar por nombre..."
            className="pl-9 rounded-xl border-brand-border bg-surface focus:border-electric focus:ring-electric/10 placeholder:text-muted-brand"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
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
          <ActiveFilterChips filters={filters} onFiltersChange={setFilters} />
        </div>
      )}

      {/* Filter panel (slide-out sheet) */}
      <CandidateFilterPanel
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onFiltersChange={setFilters}
        resetFilters={resetFilters}
      />

      {/* Content */}
      <div className="mb-12">
        <DataTable
          columns={columns}
          data={candidatesWithVacancies}
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
          loading={isLoading && !data}
        />
      </div>
    </>
  );
};
