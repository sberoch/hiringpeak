"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { CandidateFilters } from "@/components/candidates/candidate-filters";
import {
  CandidatePicker,
  CandidatePickerSkeleton,
} from "@/components/vacancies/candidate-picker";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { CANDIDATE_API_KEY, getAllCandidates } from "@/lib/api/candidate";
import {
  createCandidateVacancy,
  deleteCandidateVacancy,
} from "@/lib/api/candidate-vacancy";
import {
  CANDIDATE_VACANCY_STATUS_API_KEY,
  getAllCandidateVacancyStatus,
} from "@/lib/api/candidate-vacancy-status";
import { VACANCY_API_KEY } from "@/lib/api/vacancy";
import {
  candidateVacancyFiltersAdapter,
  vacancyDisplayLabel,
} from "@/lib/utils";
import type {
  CandidateFilters as CandidateFiltersType,
  CandidateParams,
} from "@workspace/shared/types/candidate";
import type { Vacancy } from "@workspace/shared/types/vacancy";

interface AddCandidatesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vacancy: Vacancy;
}

export const AddCandidatesDialog = ({
  isOpen,
  onClose,
  vacancy,
}: AddCandidatesDialogProps) => {
  const queryClient = useQueryClient();

  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [filters, setFilters] = useState<CandidateFiltersType>({
    ...candidateVacancyFiltersAdapter(vacancy?.filters),
    limit: 1e9,
    page: 1,
  });
  const params: CandidateParams = {
    ...filters,
    areaIds: filters.areas?.map((a) => a.id),
    industryIds: filters.industries?.map((i) => i.id),
    seniorityIds: filters.seniorities?.map((s) => s.id),
  };
  const resetFilters = () => {
    setFilters({
      ...candidateVacancyFiltersAdapter(vacancy?.filters),
      limit: 1e9,
      page: 1,
    });
  };
  const clearFilters = () => {
    setFilters({
      limit: 1e9,
      page: 1,
    });
  };

  const { data, isLoading: candidatesLoading } = useQuery({
    queryKey: [CANDIDATE_API_KEY, params],
    queryFn: () => getAllCandidates(params),
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
    if (vacancy && data?.items) {
      const existingCandidateIds = vacancy.candidates.map((c) => c.candidate.id);
      const filteredCandidateIds = data.items.map((c) => c.id);

      const existingInFiltered = existingCandidateIds.filter((id) =>
        filteredCandidateIds.includes(id)
      );

      setSelectedCandidates(existingInFiltered);
    }
  }, [vacancy, data?.items]);

  const toggleCandidateSelection = (candidateId: number) => {
    setSelectedCandidates((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const { mutateAsync } = useMutation({
    mutationFn: () => {
      if (!vacancy?.id) {
        throw new Error("Vacancy ID is required");
      }

      const candidatesOfTheVacancy = vacancy.candidates.map((cv) => cv.candidate);
      const addIds = selectedCandidates.filter(
        (id) => !candidatesOfTheVacancy.some((c) => c.id === id)
      );

      const filteredCandidateIds = data?.items.map((c) => c.id) || [];
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
      const defaultCvs = cvs?.items.find((c) => c.isInitial);
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
        .then(() => {
          queryClient
            .invalidateQueries({
              queryKey: [
                CANDIDATE_VACANCY_STATUS_API_KEY,
                { order: "sort:asc", limit: 1e9, page: 1 },
              ],
            })
            .then(onClose);
        });
    },
    onError: () => {
      toast.error("Ha ocurrido un error, intente nuevamente");
    },
  });

  const handleAddSelected = () => {
    mutateAsync();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90%] lg:w-[85%] sm:max-w-[1200px] max-h-[90vh] overflow-y-auto rounded-2xl border-brand-border bg-surface">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-ink !leading-tight">
            Agregar postulantes a &quot;{vacancyDisplayLabel(vacancy)}&quot;
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <CandidateFilters
            resetFilters={resetFilters}
            filters={filters}
            onFiltersChange={setFilters}
            clearFilters={clearFilters}
          />

          <div>
            <p className="text-xs font-medium text-muted-brand mb-3">
              Resultados ({data?.meta.totalItems ?? 0})
            </p>
            {candidatesLoading ? (
              <CandidatePickerSkeleton />
            ) : (
              <CandidatePicker
                candidates={data?.items ?? []}
                selectedCandidates={selectedCandidates}
                toggleCandidateSelection={toggleCandidateSelection}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row justify-end gap-2">
          <Button variant="brand-ghost" onClick={onClose}>
            Cancelar
          </Button>

          <Button
            onClick={handleAddSelected}
            disabled={selectedCandidates.length === 0}
            variant="brand"
          >
            Guardar cambios ({selectedCandidates.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
