"use client";

import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Skeleton } from "@workspace/ui/components/skeleton";
import type { Vacancy, VacancyFiltersType } from "@workspace/shared/types/vacancy";
import type { PaginatedResponse } from "@workspace/shared/types/api";
import {
  ActiveVacancyFilterChips,
  useActiveVacancyFilterCount,
  VacancyFilterPanel,
} from "./vacancy-filter-panel";
import { VacancyCard } from "./vacancy-card";

interface VacancyListPanelProps {
  data: PaginatedResponse<Vacancy> | undefined;
  isLoading: boolean;
  filters: VacancyFiltersType;
  setFilters: (filters: VacancyFiltersType) => void;
  resetFilters: () => void;
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
  selectedVacancyId: number | null;
  onSelectVacancy: (vacancy: Vacancy) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  mobileMode?: boolean;
}

export function VacancyListPanel({
  data,
  isLoading,
  filters,
  setFilters,
  resetFilters,
  filtersOpen,
  setFiltersOpen,
  selectedVacancyId,
  onSelectVacancy,
  onPreviousPage,
  onNextPage,
  mobileMode,
}: VacancyListPanelProps) {
  const router = useRouter();
  const activeFilterCount = useActiveVacancyFilterCount(filters);
  const currentPage = filters.page || 1;
  const totalPages = data?.meta.totalPages || 1;
  const totalItems = data?.meta.totalItems || 0;

  return (
    <div className="flex flex-col h-full">
      {/* Search + filters */}
      <div className="space-y-3 pb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-brand" />
            <Input
              type="search"
              placeholder="Buscar vacantes..."
              className="pl-9 rounded-xl border-brand-border bg-surface focus:border-electric focus:ring-electric/10 placeholder:text-muted-brand"
              value={filters.title || ""}
              onChange={(e) =>
                setFilters({ ...filters, title: e.target.value })
              }
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setFiltersOpen(true)}
            className="relative shrink-0 rounded-xl border-brand-border text-slate-brand hover:text-ink hover:border-electric hover:bg-electric/5 transition-all h-10 w-10"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-electric text-[9px] font-bold text-white px-1">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {activeFilterCount > 0 && (
          <ActiveVacancyFilterChips
            filters={filters}
            onFiltersChange={setFilters}
          />
        )}
      </div>

      {/* Vacancy list */}
      <div className="flex-1 overflow-y-auto space-y-2 2xl:space-y-2.5 min-h-0">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-brand-border p-4 space-y-2">
              <Skeleton className="h-4 w-3/4 bg-brand-border-light rounded-md" />
              <Skeleton className="h-3 w-1/2 bg-brand-border-light rounded-md" />
              <Skeleton className="h-3 w-1/3 bg-brand-border-light rounded-md" />
            </div>
          ))
        ) : data?.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <img
              src="/images/search.png"
              alt=""
              className="w-28 h-28 opacity-20 select-none pointer-events-none"
              draggable={false}
            />
            <p className="text-muted-brand font-medium text-sm">
              No se encontraron vacantes.
            </p>
          </div>
        ) : (
          data?.items.map((vacancy) => (
            <VacancyCard
              key={vacancy.id}
              vacancy={vacancy}
              isSelected={selectedVacancyId === vacancy.id}
              onClick={() =>
                mobileMode
                  ? router.push(`/vacancies/${vacancy.id}`)
                  : onSelectVacancy(vacancy)
              }
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-brand-border-light mt-2">
          <span className="text-xs text-muted-brand">
            {totalItems} vacante{totalItems !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              onClick={onPreviousPage}
              disabled={currentPage <= 1}
              className="h-7 w-7 rounded-lg border-brand-border hover:border-electric/30 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-slate-brand px-1.5">
              {currentPage}/{totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={onNextPage}
              disabled={currentPage >= totalPages}
              className="h-7 w-7 rounded-lg border-brand-border hover:border-electric/30 disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Filter sheet */}
      <VacancyFilterPanel
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onFiltersChange={setFilters}
        resetFilters={resetFilters}
      />
    </div>
  );
}
