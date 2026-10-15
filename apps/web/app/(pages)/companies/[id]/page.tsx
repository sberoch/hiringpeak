"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Download,
  Edit,
  FileText,
  Info,
  Trash,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { DataTable } from "@workspace/ui/components/data-table";
import { PageHeading } from "@workspace/ui/components/page-heading";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  COMPANY_STATUS_NAMES,
  CompanyStatusEnum,
} from "@workspace/shared/types/company";
import { PermissionCode } from "@workspace/shared/enums";
import { downloadFile } from "@/lib/download";
import { cn } from "@/lib/utils";
import { useVacancyFilters } from "@/hooks/use-vacancy-filters";
import { companyDetailColumns as vacancyColumns } from "@/components/vacancies/vacancy-table-columns";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { DeleteCompanyDialog } from "@/components/companies/delete-company-dialog";
import { EditCompanySheet } from "@/components/companies/edit-company-sheet";
import { TasksInContextCard } from "@/components/tasks/tasks-in-context-card";
import { CompanyContactsTab } from "@/components/companies/company-contacts-tab";
import {
  COMPANIES_API_KEY,
  downloadCompanyReportPdf,
  getCompanyById,
} from "@/lib/api/company";
import { getAllVacancies, VACANCY_API_KEY } from "@/lib/api/vacancy";

type CompanyTab = "resumen" | "contactos" | "vacantes" | "tareas";

function CompanyDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-24 bg-brand-border-light animate-pulse rounded-xl" />
          <div className="h-10 w-10 bg-brand-border-light animate-pulse rounded-xl" />
          <div className="space-y-1.5">
            <div className="h-6 w-56 bg-brand-border-light animate-pulse rounded-lg" />
            <div className="h-4 w-36 bg-brand-border-light animate-pulse rounded-lg" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-brand-border-light animate-pulse rounded-xl" />
          <div className="h-9 w-40 bg-brand-border-light animate-pulse rounded-xl" />
          <div className="h-9 w-24 bg-brand-border-light animate-pulse rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-[260px] bg-brand-border-light animate-pulse rounded-2xl" />
        <div className="h-[260px] bg-brand-border-light animate-pulse rounded-2xl" />
      </div>
      <div className="h-8 w-48 bg-brand-border-light animate-pulse rounded-xl" />
      <div className="h-[400px] bg-brand-border-light animate-pulse rounded-2xl" />
    </div>
  );
}

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const companyId = Number(id);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [tab, setTab] = useState<CompanyTab>("resumen");

  const {
    filters,
    params: vacancyParams,
    onPaginationChange,
    onSortingChange,
  } = useVacancyFilters({
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
        <h2 className="text-lg font-bold tracking-tight text-ink">
          Empresa no valida
        </h2>
        <p className="text-sm text-slate-brand mt-1">
          No se pudo cargar el detalle de la empresa.
        </p>
        <Button asChild className="mt-4">
          <Link href="/companies">Volver a empresas</Link>
        </Button>
      </div>
    );
  }

  if (isCompanyLoading || !company) {
    if (!company && !isCompanyLoading) {
      return (
        <div className="rounded-2xl border border-brand-border bg-surface p-6">
          <h2 className="text-lg font-bold tracking-tight text-ink">
            Empresa no encontrada
          </h2>
          <p className="text-sm text-slate-brand mt-1">
            No existe una empresa con este identificador.
          </p>
          <Button asChild className="mt-4">
            <Link href="/companies">Volver a empresas</Link>
          </Button>
        </div>
      );
    }
    return <CompanyDetailSkeleton />;
  }

  return (
    <div className="space-y-6 min-w-0">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="brand-ghost"
            className="bg-white h-10 px-4 text-sm font-medium"
            onClick={() => router.back()}
          >
            ← Volver
          </Button>
          <PageHeading
            icon={Building2}
            title={
              <span className="flex items-center gap-2.5">
                {company.name}
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
              </span>
            }
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="brand-ghost"
            className="bg-white"
            onClick={() => setIsEditSheetOpen(true)}
          >
            <Edit className="h-4 w-4 mr-1.5" />
            Editar
          </Button>
          <Button
            size="sm"
            variant="brand-ghost"
            className="bg-white"
            onClick={() => downloadReportMutation.mutate()}
            disabled={downloadReportMutation.isPending}
          >
            <Download className="h-4 w-4 mr-1.5" />
            {downloadReportMutation.isPending
              ? "Generando PDF..."
              : "Descargar reporte"}
          </Button>
          <PermissionGuard permissions={[PermissionCode.COMPANY_MANAGE]}>
            <Button
              variant="brand-ghost"
              size="sm"
              className="bg-white text-red-600 hover:bg-red-50 hover:border-red-200"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash className="h-4 w-4 mr-1.5" />
              Eliminar
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as CompanyTab)}
        className="gap-5"
      >
        <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b border-brand-border bg-transparent p-0">
          {(
            [
              { key: "resumen", label: "Resumen" },
              {
                key: "contactos",
                label: "Contactos",
                count: company.contacts.length,
              },
              {
                key: "vacantes",
                label: "Vacantes",
                count: company.vacancyCount ?? 0,
              },
              { key: "tareas", label: "Tareas" },
            ] as { key: CompanyTab; label: string; count?: number }[]
          ).map((item) => (
            <TabsTrigger
              key={item.key}
              value={item.key}
              className="-mb-px h-10 flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-3 text-sm font-semibold text-slate-brand shadow-none data-[state=active]:border-electric data-[state=active]:bg-transparent data-[state=active]:text-ink data-[state=active]:shadow-none"
            >
              {item.label}
              {item.count != null && (
                <span className="rounded-md bg-brand-border-light px-1.5 py-0.5 text-[11px] font-semibold text-slate-brand">
                  {item.count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="resumen">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Detalles card */}
            <div className="rounded-2xl border border-brand-border bg-surface p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-electric/10 text-electric">
                  <Info className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-ink">Detalles</h3>
              </div>
              <div className="space-y-3 text-sm">
                <button
                  type="button"
                  className="flex w-full justify-between text-left"
                  onClick={() => setTab("contactos")}
                >
                  <span className="text-muted-brand">Contactos</span>
                  <span className="text-ink font-medium hover:text-electric">
                    {company.contacts.length}
                  </span>
                </button>
                <div className="h-px bg-brand-border-light" />
                <div className="flex justify-between">
                  <span className="text-muted-brand">Vacantes</span>
                  <span className="text-ink font-medium">
                    {company.vacancyCount ?? 0}
                  </span>
                </div>
                {company.createdAt && (
                  <>
                    <div className="h-px bg-brand-border-light" />
                    <div className="flex justify-between">
                      <span className="text-muted-brand">
                        Fecha de creación
                      </span>
                      <span className="text-ink font-medium">
                        {new Date(company.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Descripción card */}
            <div className="rounded-2xl border border-brand-border bg-surface p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-electric/10 text-electric">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-ink">Descripción</h3>
              </div>
              {company.description ? (
                <div className="whitespace-pre-wrap text-sm text-slate-brand leading-relaxed max-h-[300px] overflow-y-auto">
                  {company.description}
                </div>
              ) : (
                <div className="text-muted-brand text-sm italic">
                  No hay descripción disponible
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contactos">
          <CompanyContactsTab company={company} />
        </TabsContent>

        <TabsContent value="vacantes">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric/10 text-electric">
                <Users className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold tracking-tight text-ink">
                Vacantes de la empresa
              </h2>
            </div>
            <DataTable
              columns={vacancyColumns}
              loading={isVacanciesLoading && !vacancies}
              data={vacancies?.items || []}
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
          </div>
        </TabsContent>

        <TabsContent value="tareas">
          <TasksInContextCard
            variant="compact"
            context={{ type: "company", id: companyId, label: company.name }}
          />
        </TabsContent>
      </Tabs>

      {isDeleteDialogOpen && (
        <DeleteCompanyDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onDeleted={() => router.push("/companies")}
          company={company}
        />
      )}
      {isEditSheetOpen && (
        <EditCompanySheet
          isOpen={isEditSheetOpen}
          onClose={() => {
            setIsEditSheetOpen(false);
            queryClient.invalidateQueries({
              queryKey: [COMPANIES_API_KEY, id],
            });
          }}
          company={company}
        />
      )}
    </div>
  );
}
