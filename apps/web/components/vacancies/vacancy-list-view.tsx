"use client";

import Link from "next/link";
import { Briefcase, Plus } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { PageHeading } from "@workspace/ui/components/page-heading";
import { PermissionCode } from "@workspace/shared/enums";
import type { VacancyFiltersType } from "@workspace/shared/types/vacancy";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { useVacancyFilters } from "@/hooks/use-vacancy-filters";
import { NewAiVacancyLink } from "./new-ai-vacancy-link";
import { VacancyTable } from "./vacancy-table";
import { VacancyListReportButton } from "./vacancy-list-report-button";

interface VacancyListViewProps {
  initialFilters?: VacancyFiltersType;
}

/**
 * Owns the vacancy list filter state so both the header actions (the Vacancy
 * List Report download, which needs the live filters) and the list/preview
 * panels below share a single source of truth. Filters are not URL-synced, so
 * lifting them here is what lets the "Descargar listado" button — sitting up in
 * the page header next to "Nueva vacante" — export exactly what's on screen.
 */
export function VacancyListView({ initialFilters }: VacancyListViewProps) {
  const { filters, params, resetFilters, setFilters } = useVacancyFilters({
    initialValues: {
      limit: 50,
      page: 1,
      order: "id:desc",
      ...initialFilters,
    },
  });

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <PageHeading
          icon={Briefcase}
          title="Vacantes"
          description="Gestiona las vacantes y su proceso de selección."
        />
        <div className="flex items-center gap-2">
          <PermissionGuard permissions={[PermissionCode.VACANCY_MANAGE]}>
            <Button
              asChild
              className="bg-electric hover:bg-electric-light text-white rounded-md px-5 py-2 font-semibold shadow-none hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.3)] transition-all cursor-pointer"
            >
              <Link href="/vacancies/new">
                <Plus className="h-4 w-4" />
                Nueva vacante
              </Link>
            </Button>
          </PermissionGuard>
          <NewAiVacancyLink />
          <VacancyListReportButton filters={filters} params={params} />
        </div>
      </div>
      <VacancyTable
        filters={filters}
        setFilters={setFilters}
        resetFilters={resetFilters}
        params={params}
      />
    </div>
  );
}
