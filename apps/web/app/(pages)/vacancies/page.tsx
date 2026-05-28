import { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { PageHeading } from "@workspace/ui/components/page-heading";

import { NewAiVacancyLink } from "@/components/vacancies/new-ai-vacancy-link";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { VacancyTable } from "@/components/vacancies/vacancy-table";
import { PermissionCode } from "@workspace/shared/enums";
import { getAllVacancyStatuses } from "@/lib/api/vacancy-status";
import type { VacancyFiltersType } from "@workspace/shared/types/vacancy";

export const metadata: Metadata = {
  title: "Vacantes",
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
        <PageHeading
          icon={Briefcase}
          title="Vacantes"
          description="Gestiona las vacantes y su proceso de selección."
        />
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

          <NewAiVacancyLink />

        </PermissionGuard>
      </div >
      <VacancyTable initialFilters={initialFilters} />
    </div >
  );
}
