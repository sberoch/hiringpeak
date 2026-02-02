"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import { Heading } from "@workspace/ui/components/heading";
import { CandidatePicker } from "@/components/vacancies/candidate-picker";
import { VacancyFiltersCard } from "@/components/vacancies/vacancy-filters-card";
import { CANDIDATE_API_KEY, getAllCandidates } from "@/lib/api/candidate";
import {
  createCandidateVacancy,
  deleteCandidateVacancy,
} from "@/lib/api/candidate-vacancy";
import {
  CANDIDATE_VACANCY_STATUS_API_KEY,
  getAllCandidateVacancyStatus,
} from "@/lib/api/candidate-vacancy-status";
import { getVacancyById, VACANCY_API_KEY } from "@/lib/api/vacancy";
import { candidateVacancyFiltersAdapter } from "@/lib/utils";

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
  params: { id: string };
}) {
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data: vacancy,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [VACANCY_API_KEY, params.id],
    queryFn: () => getVacancyById(params.id),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const filterParams = vacancy?.filters
    ? {
      ...candidateVacancyFiltersAdapter(vacancy?.filters),
      limit: 1e9,
      page: 1,
    }
    : {};

  const { data: candidates, isLoading: candidatesLoading } = useQuery({
    queryKey: [CANDIDATE_API_KEY, filterParams],
    queryFn: () => getAllCandidates(filterParams),
    enabled: !!vacancy,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const { data: cvs } = useQuery({
    queryKey: [
      CANDIDATE_VACANCY_STATUS_API_KEY,
      { order: "sort:asc", limit: 1e9, page: 1 },
    ],
    queryFn: () =>
      getAllCandidateVacancyStatus({ order: "sort:asc", limit: 1e9, page: 1 }),
  });

  useEffect(() => {
    if (vacancy && candidates?.items) {
      const existingCandidateIds = vacancy.candidates.map(
        (cv) => cv.candidate.id
      );
      const filteredCandidateIds = candidates.items.map((c) => c.id);

      const existingInFiltered = existingCandidateIds.filter((id) =>
        filteredCandidateIds.includes(id)
      );

      setSelectedCandidates(existingInFiltered);
    }
  }, [vacancy, candidates?.items]);

  const { mutateAsync } = useMutation({
    mutationFn: () => {
      if (!vacancy) throw new Error("Vacancy is required");
      const candidatesOfTheVacancy = vacancy?.candidates.map(
        (cv) => cv.candidate
      );
      const addIds = selectedCandidates.filter(
        (id) => !candidatesOfTheVacancy.some((c) => c.id === id)
      );

      const filteredCandidateIds = candidates?.items.map((c) => c.id) || [];
      const deleteIds = candidatesOfTheVacancy
        .filter(
          (c) =>
            filteredCandidateIds.includes(c.id) &&
            !selectedCandidates.includes(c.id)
        )
        .map((c) => c.id);

      const cvIds = vacancy.candidates
        .map((cv) =>
          deleteIds.includes(cv.candidate.id) ? cv.id.toString() : null
        )
        .filter((a) => a !== null);
      const defaultCvs = cvs?.items.find((cv) => cv.isInitial);
      if (!defaultCvs?.id) throw new Error("Error fetching vacancy status");

      return Promise.all([
        ...cvIds.map(deleteCandidateVacancy),
        ...addIds.map((id) =>
          createCandidateVacancy({
            candidateId: id,
            vacancyId: vacancy.id,
            candidateVacancyStatusId: defaultCvs.id,
            notes: "",
          })
        ),
      ]);
    },
    onSuccess: () => {
      toast.success("Postulantes agregados correctamente");
      queryClient
        .invalidateQueries({
          queryKey: [VACANCY_API_KEY, vacancy?.id],
        })
        .then(() => router.push(`/vacancies/${vacancy?.id}`));
    },
    onError: () => {
      toast.error("Ha ocurrido un error, intente nuevamente");
    },
  });

  if (isError) {
    toast.error("Error al buscar vacante");
    return router.push("/vacancies");
  }

  if (!vacancy || (!vacancy && isLoading))
    return <CandidateSelectionSkeleton />;

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
      {candidatesLoading ? (
        <CandidatePickerSkeleton />
      ) : (
        <CandidatePicker
          candidates={candidates?.items || []}
          selectedCandidates={selectedCandidates}
          toggleCandidateSelection={toggleCandidateSelection}
          vacancy={vacancy}
        />
      )}
      <div className="flex mt-6">
        {(candidates?.items?.length || 0) > 0 && (
          <Button
            variant="default"
            className="w-full lg:w-fit"
            onClick={() => mutateAsync()}
          >
            Guardar cambios
          </Button>
        )}
      </div>
    </div>
  );
}
