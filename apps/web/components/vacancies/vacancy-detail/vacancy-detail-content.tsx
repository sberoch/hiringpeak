"use client";

import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users } from "lucide-react";

import { KanbanBoard } from "@/components/candidates/kanban-board/board";
import { VacancyDetailHeader } from "@/components/vacancies/vacancy-detail/vacancy-detail-header";
import { getVacancyById, VACANCY_API_KEY } from "@/lib/api/vacancy";

function VacancyDetailSkeleton() {
  return (
    <div className="mb-20">
      <div className="h-10 w-72 bg-brand-border-light animate-pulse rounded-xl mb-4" />
      <div className="w-full h-48 bg-brand-border-light animate-pulse rounded-2xl mb-6" />

      <div className="w-full">
        <div className="h-8 w-48 bg-brand-border-light animate-pulse rounded-xl mb-4" />
        <div className="w-full h-[600px] bg-brand-border-light animate-pulse rounded-2xl" />
      </div>
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
    <div className="mb-20">
      <VacancyDetailHeader
        vacancy={data}
        onDialogClose={() => {
          queryClient.invalidateQueries({
            queryKey: [VACANCY_API_KEY, vacancyId],
          });
        }}
      />
      <div className="mt-8 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric/10 text-electric">
            <Users className="h-4 w-4" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-ink">
            Postulantes
          </h2>
        </div>
        <KanbanBoard candidates={data.candidates} vacancyId={vacancyId} />
      </div>
    </div>
  );
}
