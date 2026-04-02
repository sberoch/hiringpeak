"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import { Heading } from "@workspace/ui/components/heading";
import { CandidatePicker } from "@/components/vacancies/candidate-picker";
import { VacancyFiltersCard } from "@/components/vacancies/vacancy-filters-card";
import { CANDIDATE_API_KEY, getAllCandidates } from "@/lib/api/candidate";
import { getVacancyById, VACANCY_API_KEY } from "@/lib/api/vacancy";
import { vacancyFilterToCandidateFilter } from "@/lib/utils";

function CandidateSelectionSkeleton() {
  return (
    <div className="container flex flex-col gap-2 mb-12">
      <div>
        <div className="h-8 w-64 bg-gray-200 animate-pulse rounded mb-2" />
        <div className="h-4 w-full max-w-2xl bg-gray-200 animate-pulse rounded mb-6" />
      </div>

      <div className="w-full h-32 bg-gray-200 animate-pulse rounded-lg mb-4" />

      <div className="w-full h-[600px] bg-gray-200 animate-pulse rounded-lg" />

      <div className="flex mt-6">
        <div className="h-10 w-40 bg-gray-200 animate-pulse rounded" />
      </div>
    </div>
  );
}

function CandidatePickerSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex overflow-hidden rounded-lg border">
          <div className="w-1/4 bg-gray-200 animate-pulse" />
          <div className="w-3/4 p-4">
            <div className="h-6 w-32 bg-gray-200 animate-pulse rounded mb-2" />
            <div className="h-4 w-24 bg-gray-200 animate-pulse rounded mb-3" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
              <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EditVacancyCandidateSelectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    data: vacancy,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [VACANCY_API_KEY, id],
    queryFn: () => getVacancyById(id),
  });

  const { data: candidates } = useQuery({
    queryKey: [CANDIDATE_API_KEY],
    queryFn: () =>
      getAllCandidates({
        limit: 1e9,
        page: 1,
        ...vacancyFilterToCandidateFilter(vacancy?.filters),
      }),
    enabled: !!vacancy,
  });

  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const router = useRouter();

  if (isError) {
    toast.error("Error al buscar vacante");
    return router.push("/vacancies");
  }

  if (!vacancy || (!vacancy && isLoading))
    return <CandidateSelectionSkeleton />;

  const handleAddCandidates = () => {
    const candidatesToAdd = selectedCandidates.filter(
      (id) => !vacancy.candidates.some((c) => c.candidate.id === id)
    );
    const candidatesToRemove = selectedCandidates.filter((id) =>
      vacancy.candidates.some((c) => c.candidate.id === id)
    );

    console.log("Candidates to add:", candidatesToAdd);
    console.log("Candidates to remove:", candidatesToRemove);
    toast.success("Postulantes agregados correctamente");
    router.push(`/vacancies/${vacancy.id}`);
  };

  const toggleCandidateSelection = (candidateId: number) => {
    setSelectedCandidates((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  return (
    <div className="container flex flex-col gap-2 mb-12">
      <div>
        <Heading>Selección de postulantes</Heading>
        <p className="text-zinc-500 mb-6">
          Selecciona los postulantes que deseas agregar a esta vacante. Los
          postulantes ya asignados aparecen sombreados. Puedes hacer clic para
          removerlos.
        </p>
      </div>
      <VacancyFiltersCard vacancy={vacancy} />
      {!candidates ? (
        <CandidatePickerSkeleton />
      ) : (
        <CandidatePicker
          candidates={candidates.items}
          selectedCandidates={selectedCandidates}
          toggleCandidateSelection={toggleCandidateSelection}
        />
      )}
      <div className="flex mt-6">
        <Button
          variant="default"
          className="w-full lg:w-fit"
          onClick={handleAddCandidates}
        >
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
