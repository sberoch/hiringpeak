import { Metadata } from "next";
import { Briefcase } from "lucide-react";

import { NewVacancySheetWithPermission } from "@/components/vacancies/new-vacancy-sheet-with-permission";
import { VacancyTable } from "@/components/vacancies/vacancy-table";
import { getAllVacancyStatuses } from "@/lib/api/vacancy-status";
import type { VacancyFiltersType } from "@workspace/shared/types/vacancy";

export const metadata: Metadata = {
  title: "Vacantes | PRATT FIT",
};

interface VacanciesProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Vacancies({ searchParams }: VacanciesProps) {
  const resolvedSearchParams = await searchParams;
  const initialFilters: VacancyFiltersType = {};

  if (resolvedSearchParams.status) {
    const statusParam = Array.isArray(resolvedSearchParams.status)
      ? resolvedSearchParams.status[0]
      : resolvedSearchParams.status;

    if (statusParam && isNaN(Number(statusParam))) {
      const vacancyStatuses = await getAllVacancyStatuses({
        limit: 1e9,
        page: 1,
      });
      const status = vacancyStatuses.items.find(
        (s) =>
          s.name.toLowerCase().includes(statusParam.toLowerCase()) ||
          statusParam.toLowerCase().includes(s.name.toLowerCase())
      );
      if (status) {
        initialFilters.status = status;
      }
    } else if (statusParam) {
      const vacancyStatuses = await getAllVacancyStatuses({
        limit: 1e9,
        page: 1,
      });
      const status = vacancyStatuses.items.find(
        (s) => s.id === Number(statusParam)
      );
      if (status) {
        initialFilters.status = status;
      }
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric text-white shadow-[0_2px_8px_-2px_rgba(0,102,255,0.4)]">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Vacantes
            </h1>
            <p className="text-sm text-slate-brand leading-relaxed">
              Gestiona las vacantes y su proceso de selección.
            </p>
          </div>
        </div>
        <NewVacancySheetWithPermission />
      </div>
      <VacancyTable initialFilters={initialFilters} />
    </div>
  );
}
