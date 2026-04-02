import { Metadata } from "next";

import { Heading } from "@workspace/ui/components/heading";
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
    <div className="container flex flex-col">
      <div className="flex items-center justify-between">
        <Heading>Vacantes</Heading>
        <NewVacancySheetWithPermission />
      </div>
      <VacancyTable initialFilters={initialFilters} />
    </div>
  );
}
