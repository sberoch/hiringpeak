"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useVacancyFilters } from "@/hooks/use-vacancy-filters";
import { getAllVacancies, VACANCY_API_KEY } from "@/lib/api/vacancy";
import type { PaginatedResponse } from "@workspace/shared/types/api";
import type {
  Vacancy,
  VacancyFiltersType,
} from "@workspace/shared/types/vacancy";
import { VacancyListPanel } from "./vacancy-list-panel";
import { VacancyPreviewPanel } from "./vacancy-preview-panel";

interface VacancyTableProps {
  initialFilters?: VacancyFiltersType;
}

export const VacancyTable = ({ initialFilters }: VacancyTableProps) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedVacancyId, setSelectedVacancyId] = useState<number | null>(
    null,
  );

  const { filters, params, resetFilters, setFilters } = useVacancyFilters({
    initialValues: {
      limit: 15,
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

  // Auto-select first vacancy when data loads
  useEffect(() => {
    if (data?.items.length && selectedVacancyId === null) {
      setSelectedVacancyId(data.items[0]!.id);
    }
  }, [data?.items, selectedVacancyId]);

  // If selected vacancy is not in current page, reset selection
  useEffect(() => {
    if (data?.items.length && selectedVacancyId !== null) {
      const found = data.items.find((v) => v.id === selectedVacancyId);
      if (!found) {
        setSelectedVacancyId(data.items[0]?.id ?? null);
      }
    }
  }, [data?.items]);

  const selectedVacancy =
    data?.items.find((v) => v.id === selectedVacancyId) ?? null;

  const handlePreviousPage = () => {
    const currentPage = filters.page || 1;
    if (currentPage > 1) {
      setFilters({ ...filters, page: currentPage - 1 });
      setSelectedVacancyId(null);
    }
  };

  const handleNextPage = () => {
    const currentPage = filters.page || 1;
    const totalPages = data?.meta.totalPages || 1;
    if (currentPage < totalPages) {
      setFilters({ ...filters, page: currentPage + 1 });
      setSelectedVacancyId(null);
    }
  };

  return (
    <>
      {/* Desktop: split panel */}
      <div className="hidden lg:flex gap-0 h-[calc(100vh-140px)]">
        {/* Left panel */}
        <div className="w-[380px] 2xl:w-[440px] shrink-0 pr-3 border-r border-brand-border-light">
          <VacancyListPanel
            data={data}
            isLoading={isLoading}
            filters={filters}
            setFilters={setFilters}
            resetFilters={resetFilters}
            filtersOpen={filtersOpen}
            setFiltersOpen={setFiltersOpen}
            selectedVacancyId={selectedVacancyId}
            onSelectVacancy={(v) => setSelectedVacancyId(v.id)}
            onPreviousPage={handlePreviousPage}
            onNextPage={handleNextPage}
          />
        </div>

        {/* Right panel */}
        <div className="flex-1 min-w-0 pl-3 overflow-hidden">
          <VacancyPreviewPanel
            vacancy={selectedVacancy}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Mobile: list only, cards link to detail page */}
      <div className="lg:hidden">
        <VacancyListPanel
          data={data}
          isLoading={isLoading}
          filters={filters}
          setFilters={setFilters}
          resetFilters={resetFilters}
          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}
          selectedVacancyId={null}
          onSelectVacancy={() => {}}
          onPreviousPage={handlePreviousPage}
          onNextPage={handleNextPage}
          mobileMode
        />
      </div>
    </>
  );
};
