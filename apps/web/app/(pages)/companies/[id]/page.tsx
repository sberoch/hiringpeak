"use client";

import { use } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Building2, Download, Mail, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { DataTable } from "@workspace/ui/components/data-table";
import {
  COMPANY_STATUS_NAMES,
  CompanyStatusEnum,
} from "@workspace/shared/types/company";
import { downloadFile } from "@/lib/download";
import { cn } from "@/lib/utils";
import { useVacancyFilters } from "@/hooks/use-vacancy-filters";
import { columns as vacancyColumns } from "@/components/vacancies/vacancy-table-columns";
import {
  COMPANIES_API_KEY,
  downloadCompanyReportPdf,
  getCompanyById,
} from "@/lib/api/company";
import { getAllVacancies, VACANCY_API_KEY } from "@/lib/api/vacancy";

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const companyId = Number(id);

  const { filters, params: vacancyParams, onPaginationChange, onSortingChange, setFilters } =
    useVacancyFilters({
      initialValues: { limit: 10, page: 1, order: "id:desc" },
    });

  const { data: company, isLoading: isCompanyLoading } = useQuery({
    queryKey: [COMPANIES_API_KEY, id],
    queryFn: () => getCompanyById(id),
    enabled: Number.isFinite(companyId) && companyId > 0,
  });

  const { data: vacancies, isLoading: isVacanciesLoading } = useQuery({
    queryKey: [VACANCY_API_KEY, { ...vacancyParams, companyId }],
    queryFn: () => getAllVacancies({ ...vacancyParams, companyId }),
    enabled: !!company,
  });

  const downloadReportMutation = useMutation({
    mutationFn: () => downloadCompanyReportPdf(id),
    onSuccess: (file) => {
      downloadFile(file);
    },
    onError: () => {
      toast.error("No se pudo descargar el reporte PDF.");
    },
  });

  if (!Number.isFinite(companyId) || companyId <= 0) {
    return (
      <div className="rounded-2xl border border-brand-border bg-surface p-6">
        <h2 className="text-lg font-bold tracking-tight text-ink">Empresa no valida</h2>
        <p className="text-sm text-slate-brand mt-1">No se pudo cargar el detalle de la empresa.</p>
        <Button asChild className="mt-4">
          <Link href="/companies">Volver a empresas</Link>
        </Button>
      </div>
    );
  }

  if (!company && !isCompanyLoading) {
    return (
      <div className="rounded-2xl border border-brand-border bg-surface p-6">
        <h2 className="text-lg font-bold tracking-tight text-ink">Empresa no encontrada</h2>
        <p className="text-sm text-slate-brand mt-1">No existe una empresa con este identificador.</p>
        <Button asChild className="mt-4">
          <Link href="/companies">Volver a empresas</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-brand-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-electric" />
              <h1 className="text-xl font-bold tracking-tight text-ink">
                {company?.name ?? "Cargando empresa..."}
              </h1>
              {company && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "rounded-lg text-xs font-semibold",
                    company.status === CompanyStatusEnum.ACTIVE &&
                      "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
                    company.status === CompanyStatusEnum.PROSPECT &&
                      "bg-amber-50 text-amber-700 hover:bg-amber-50",
                  )}
                >
                  {COMPANY_STATUS_NAMES[company.status]}
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-brand leading-relaxed">
              {company?.description || "Sin descripcion"}
            </p>
          </div>
          <Button
            disabled={!company || downloadReportMutation.isPending}
            onClick={() => downloadReportMutation.mutate()}
          >
            <Download className="h-4 w-4" />
            {downloadReportMutation.isPending
              ? "Generando PDF..."
              : "Descargar PDF"}
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-brand-border-light bg-canvas px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-brand">Vacantes</p>
            <p className="mt-1 text-lg font-bold text-ink">{company?.vacancyCount ?? 0}</p>
          </div>
          <div className="rounded-xl border border-brand-border-light bg-canvas px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-brand">Cliente</p>
            <p className="mt-1 text-sm font-medium text-ink flex items-center gap-2">
              <UserRound className="h-4 w-4 text-muted-brand" />
              {company?.clientName || "-"}
            </p>
          </div>
          <div className="rounded-xl border border-brand-border-light bg-canvas px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-brand">Email cliente</p>
            <p className="mt-1 text-sm font-medium text-ink flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-brand" />
              {company?.clientEmail || "-"}
            </p>
          </div>
          <div className="rounded-xl border border-brand-border-light bg-canvas px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-brand">Telefono cliente</p>
            <p className="mt-1 text-sm font-medium text-ink flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-brand" />
              {company?.clientPhone || "-"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="mb-6">
          <h2 className="text-lg font-bold tracking-tight text-ink">Vacantes de la empresa</h2>
          <p className="text-sm text-slate-brand mt-0.5 leading-relaxed">
            Consulta las vacantes asociadas y su estado de gestion.
          </p>
        </div>
        <DataTable
          columns={vacancyColumns}
          loading={isVacanciesLoading && !vacancies}
          data={vacancies?.items || []}
          search={{
            value: filters.title ?? "",
            onSearchChange: (value) => {
              setFilters({ ...filters, title: value });
            },
          }}
          pagination={{
            totalItems: vacancies?.meta.totalItems || 1,
            pageCount: vacancies?.meta.totalPages || 1,
            pageIndex: (filters.page || 1) - 1,
            pageSize: filters.limit || 10,
            onPaginationChange,
          }}
          sorting={{
            order: filters.order,
            onSortingChange,
          }}
        />
      </section>
    </div>
  );
}
