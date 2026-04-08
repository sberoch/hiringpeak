"use client";

import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DollarSign, FileText, Info, Users } from "lucide-react";

import { KanbanBoard } from "@/components/candidates/kanban-board/board";
import { VacancyDetailHeader } from "@/components/vacancies/vacancy-detail/vacancy-detail-header";
import { VacancyDetailHeaderFilters } from "@/components/vacancies/vacancy-detail/vacancy-detail-header-filters";
import { getVacancyById, VACANCY_API_KEY } from "@/lib/api/vacancy";

function VacancyDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Toolbar skeleton */}
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
          <div className="h-10 w-24 bg-brand-border-light animate-pulse rounded-xl" />
          <div className="h-10 w-36 bg-brand-border-light animate-pulse rounded-xl" />
          <div className="h-10 w-40 bg-brand-border-light animate-pulse rounded-xl" />
        </div>
      </div>

      {/* Three-column info skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr_1fr] gap-4">
        <div className="h-[220px] bg-brand-border-light animate-pulse rounded-2xl" />
        <div className="h-[220px] bg-brand-border-light animate-pulse rounded-2xl" />
        <div className="h-[180px] bg-brand-border-light animate-pulse rounded-2xl" />
      </div>

      {/* Kanban skeleton */}
      <div className="h-8 w-48 bg-brand-border-light animate-pulse rounded-xl" />
      <div className="h-[500px] bg-brand-border-light animate-pulse rounded-2xl" />
    </div>
  );
}

export function VacancyDetailContent({ vacancyId }: { vacancyId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: [VACANCY_API_KEY, vacancyId],
    queryFn: () => getVacancyById(vacancyId),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
  if (isError) {
    toast.error("Error al buscar vacante");
    router.push("/vacancies");
    return null;
  }
  if (!data || (!data && isLoading)) return <VacancyDetailSkeleton />;

  return (
    <div className="space-y-6 min-w-0">
      <VacancyDetailHeader
        vacancy={data}
        onDialogClose={() => {
          queryClient.invalidateQueries({
            queryKey: [VACANCY_API_KEY, vacancyId],
          });
        }}
      />

      {/* Three-column info grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr_1fr] gap-4">
        {/* Metadata card */}
        <div className="rounded-2xl border border-brand-border bg-surface p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-electric/10 text-electric">
              <Info className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-ink">Detalles</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-brand">Creación</span>
              <span className="text-ink font-medium">
                {dayjs(data.createdAt).toDate().toLocaleDateString()}
              </span>
            </div>
            <div className="h-px bg-brand-border-light" />
            <div className="flex justify-between">
              <span className="text-muted-brand">Actualización</span>
              <span className="text-ink font-medium">
                {dayjs(data.updatedAt).toDate().toLocaleDateString()}
              </span>
            </div>
            <div className="h-px bg-brand-border-light" />
            <div className="flex justify-between">
              <span className="text-muted-brand">Empresa</span>
              <span className="text-ink font-medium">
                {data.company.name}
              </span>
            </div>
            <div className="h-px bg-brand-border-light" />
            <div className="flex justify-between">
              <span className="text-muted-brand">Creado por</span>
              <span className="text-ink font-medium">
                {data.createdBy.name}
              </span>
            </div>
            <div className="h-px bg-brand-border-light" />
            <div className="flex justify-between">
              <span className="text-muted-brand">Asignado a</span>
              <span className="text-ink font-medium">
                {data.assignedTo.name}
              </span>
            </div>
            {data.salary && (
              <>
                <div className="h-px bg-brand-border-light" />
                <div className="flex justify-between">
                  <span className="text-muted-brand">Compensación</span>
                  <span className="text-ink font-medium">{data.salary}</span>
                </div>
              </>
            )}
            {data.closedAt && (
              <>
                <div className="h-px bg-brand-border-light" />
                <div className="flex justify-between">
                  <span className="text-muted-brand">Cerrada</span>
                  <span className="text-ink font-medium">
                    {dayjs(data.closedAt).toDate().toLocaleDateString()}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Description card */}
        <div className="rounded-2xl border border-brand-border bg-surface p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-electric/10 text-electric">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-ink">Descripción</h3>
          </div>
          {data.description ? (
            <div className="whitespace-pre-wrap text-sm text-slate-brand leading-relaxed max-h-[300px] overflow-y-auto">
              {data.description}
            </div>
          ) : (
            <div className="text-muted-brand text-sm italic">
              No hay descripción disponible
            </div>
          )}
        </div>

        {/* Filters card */}
        <VacancyDetailHeaderFilters vacancy={data} />
      </div>

      {/* Kanban section — full width */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric/10 text-electric">
            <Users className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-ink">
            Postulantes
          </h2>
        </div>
        <KanbanBoard candidates={data.candidates} vacancyId={vacancyId} />
      </div>
    </div>
  );
}
