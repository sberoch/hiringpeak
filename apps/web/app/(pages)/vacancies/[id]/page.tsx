"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { KanbanBoard } from "@/components/candidates/kanban-board/board";
import { VacancyDetailHeader } from "@/components/vacancies/vacancy-detail/vacancy-detail-header";
import { getVacancyById, VACANCY_API_KEY } from "@/lib/api/vacancy";

function VacancyDetailSkeleton() {
  return (
    <div className="container mx-auto p-4 mb-20">
      <div className="h-8 w-full bg-gray-200 animate-pulse rounded mb-4" />
      <div className="w-full h-48 bg-gray-200 animate-pulse rounded-lg mb-6" />

      <div className="w-full">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-4" />
        <div className="w-full h-[600px] bg-gray-200 animate-pulse rounded-lg" />
      </div>
    </div>
  );
}

export default function VacancyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: [VACANCY_API_KEY, id],
    queryFn: () => getVacancyById(id),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
  if (isError) {
    toast.error("Error al buscar vacante");
    return router.push("/vacancies");
  }
  if (!data || (!data && isLoading)) return <VacancyDetailSkeleton />;
  return (
    <div className="container mx-auto p-4 mb-20">
      <VacancyDetailHeader
        vacancy={data}
        onDialogClose={() => {
          queryClient.invalidateQueries({
            queryKey: [VACANCY_API_KEY, id],
          });
        }}
      />
      <div className="mt-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-2">Postulantes</h2>
        <KanbanBoard candidates={data.candidates} vacancyId={id} />
      </div>
    </div>
  );
}
