"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import type {
  VacancyFiltersType,
  VacancyParams,
} from "@workspace/shared/types/vacancy";

import {
  downloadVacancyListReportPdf,
  downloadVacancyListReportXlsx,
} from "@/lib/api/vacancy";
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

  const buildAppliedFilters = () =>
    buildActiveVacancyFilterChips(filters, users?.items).map(
      (chip) => chip.label
    );

  const downloadPdfMutation = useMutation({
    mutationFn: () =>
      downloadVacancyListReportPdf(params, buildAppliedFilters()),
    onSuccess: (file) => downloadFile(file),
    onError: () => {
      toast.error("No se pudo descargar el listado de vacantes.");
    },
  });

  const downloadXlsxMutation = useMutation({
    mutationFn: () =>
      downloadVacancyListReportXlsx(params, buildAppliedFilters()),
    onSuccess: (file) => downloadFile(file),
    onError: () => {
      toast.error("No se pudo descargar el listado de vacantes.");
    },
  });

  const isDownloading =
    downloadPdfMutation.isPending || downloadXlsxMutation.isPending;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={isDownloading}
          className="rounded-md border-brand-border px-5 py-2 font-semibold text-ink shadow-none hover:border-electric hover:bg-electric/5 transition-all cursor-pointer"
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Descargar listado
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="cursor-pointer"
          disabled={downloadPdfMutation.isPending}
          onSelect={(e) => {
            e.preventDefault();
            downloadPdfMutation.mutate();
          }}
        >
          <Download className="h-4 w-4" />
          Descargar PDF
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          disabled={downloadXlsxMutation.isPending}
          onSelect={(e) => {
            e.preventDefault();
            downloadXlsxMutation.mutate();
          }}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Descargar Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
