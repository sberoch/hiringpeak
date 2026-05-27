"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import type {
  VacancyFiltersType,
  VacancyParams,
} from "@workspace/shared/types/vacancy";

import { downloadVacancyListReportPdf } from "@/lib/api/vacancy";
import { getAllUsers, USERS_API_KEY } from "@/lib/api/user";
import { downloadFile } from "@/lib/download";
import { buildActiveVacancyFilterChips } from "./vacancy-filter-panel";

interface VacancyListReportButtonProps {
  /** Active filter objects — drive the report's "Filtros aplicados" echo. */
  filters: VacancyFiltersType;
  /** Transformed filter IDs sent to the report endpoint (pagination ignored). */
  params: VacancyParams;
}

export function VacancyListReportButton({
  filters,
  params,
}: VacancyListReportButtonProps) {
  // Shared cache key with the on-screen chips — resolves owner/creator names
  // for the echo without a second fetch.
  const { data: users } = useQuery({
    queryKey: [USERS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllUsers({ limit: 1e9, page: 1 }),
    enabled: !!(filters.createdBy || filters.assignedTo),
  });

  const downloadMutation = useMutation({
    mutationFn: () => {
      const appliedFilters = buildActiveVacancyFilterChips(
        filters,
        users?.items
      ).map((chip) => chip.label);
      return downloadVacancyListReportPdf(params, appliedFilters);
    },
    onSuccess: (file) => downloadFile(file),
    onError: () => {
      toast.error("No se pudo descargar el listado de vacantes.");
    },
  });

  return (
    <Button
      variant="outline"
      onClick={() => downloadMutation.mutate()}
      disabled={downloadMutation.isPending}
      className="rounded-md border-brand-border px-5 py-2 font-semibold text-ink shadow-none hover:border-electric hover:bg-electric/5 transition-all cursor-pointer"
    >
      {downloadMutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Descargar listado PDF
    </Button>
  );
}
