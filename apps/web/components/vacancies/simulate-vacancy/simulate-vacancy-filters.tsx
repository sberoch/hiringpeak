"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Target } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { CandidateFilters } from "@/components/candidates/candidate-filters";
import {
  CandidatePicker,
  CandidatePickerSkeleton,
} from "@/components/vacancies/candidate-picker";
import { Button } from "@workspace/ui/components/button";
import { DialogFooter } from "@workspace/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { CANDIDATE_API_KEY, getAllCandidates } from "@/lib/api/candidate";
import {
  createCandidateVacancy,
  deleteCandidateVacancy,
} from "@/lib/api/candidate-vacancy";
import {
  CANDIDATE_VACANCY_STATUS_API_KEY,
  getAllCandidateVacancyStatus,
} from "@/lib/api/candidate-vacancy-status";
import { getAllVacancies, VACANCY_API_KEY } from "@/lib/api/vacancy";
import { candidateVacancyFiltersAdapter, vacancyDisplayLabel } from "@/lib/utils";
import type {
  CandidateFilters as CandidateFiltersType,
  CandidateParams,
} from "@workspace/shared/types/candidate";
import type { Vacancy } from "@workspace/shared/types/vacancy";

interface SimulateVacancyFiltersProps {
  baseVacancy?: Vacancy;
  onBack: () => void;
}

export const SimulateVacancyFilters = ({
  baseVacancy,
  onBack,
}: SimulateVacancyFiltersProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [targetVacancyId, setTargetVacancyId] = useState<string>("");

  const [filters, setFilters] = useState<CandidateFiltersType>({
    ...candidateVacancyFiltersAdapter(baseVacancy?.filters),
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
      ...candidateVacancyFiltersAdapter(baseVacancy?.filters),
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

  const { data: candidates, isLoading: candidatesLoading } = useQuery({
    queryKey: [CANDIDATE_API_KEY, params],
    queryFn: () => getAllCandidates(params),
  });

  const { data: vacancies } = useQuery({
    queryKey: [VACANCY_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllVacancies({ limit: 1e9, page: 1 }),
    enabled: !baseVacancy,
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
    if (baseVacancy && candidates?.items) {
      const existingCandidateIds = baseVacancy.candidates.map(
        (cv) => cv.candidate.id
      );
      const filteredCandidateIds = candidates.items.map((c) => c.id);

      const existingInFiltered = existingCandidateIds.filter((id) =>
        filteredCandidateIds.includes(id)
      );

      setSelectedCandidates(existingInFiltered);
    }
  }, [baseVacancy, candidates?.items]);

  const navigateToVacancy = (vacancyId: number) => {
    queryClient
      .invalidateQueries({ queryKey: [VACANCY_API_KEY, vacancyId] })
      .then(() => {
        router.push(`/vacancies/${vacancyId}`);
      });
  };

  const { mutateAsync: handleSyncToBaseVacancy, isPending: isSyncing } =
    useMutation({
      mutationFn: () => {
        if (!baseVacancy) throw new Error("Cant use this function in this case");
        const candidatesOfTheVacancy = baseVacancy.candidates.map(
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

        const cvIds = baseVacancy.candidates
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
              vacancyId: baseVacancy.id,
              candidateVacancyStatusId: defaultCvs.id,
              notes: "",
            })
          ),
        ]);
      },
      onSuccess: () => {
        if (!baseVacancy) return;
        toast.success("Postulantes agregados correctamente");
        navigateToVacancy(baseVacancy.id);
      },
      onError: () => {
        toast.error("Ha ocurrido un error, intente nuevamente");
      },
    });

  const { mutateAsync: handleAssignToTarget, isPending: isAssigning } =
    useMutation({
      mutationFn: () => {
        const targetId = parseInt(targetVacancyId);
        if (!targetId) throw new Error("No vacancy selected");
        const defaultCvs = cvs?.items.find((cv) => cv.isInitial);
        if (!defaultCvs?.id) throw new Error("Error fetching vacancy status");

        return Promise.all(
          selectedCandidates.map((candidateId) =>
            createCandidateVacancy({
              candidateId,
              vacancyId: targetId,
              candidateVacancyStatusId: defaultCvs.id,
              notes: "",
            })
          )
        );
      },
      onSuccess: () => {
        const targetId = parseInt(targetVacancyId);
        toast.success("Postulantes agregados correctamente");
        navigateToVacancy(targetId);
      },
      onError: () => {
        toast.error("Ha ocurrido un error, intente nuevamente");
      },
    });

  const toggleCandidateSelection = (candidateId: number) => {
    setSelectedCandidates((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const isPending = isSyncing || isAssigning;
  const canSubmit =
    selectedCandidates.length > 0 &&
    !isPending &&
    (baseVacancy ? true : !!targetVacancyId);

  return (
    <div className="space-y-4">
      {baseVacancy && (
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-canvas px-3 py-1.5 text-xs">
          <Copy className="h-3.5 w-3.5 text-electric" />
          <span className="text-muted-brand">Basado en:</span>
          <span className="font-medium text-ink truncate max-w-[400px]">
            {vacancyDisplayLabel(baseVacancy)}
          </span>
        </div>
      )}

      <CandidateFilters
        filters={filters}
        resetFilters={resetFilters}
        clearFilters={clearFilters}
        onFiltersChange={setFilters}
      />

      <div>
        <p className="text-xs font-medium text-muted-brand mb-3">
          Resultados ({candidates?.meta.totalItems ?? 0})
        </p>
        {candidatesLoading ? (
          <CandidatePickerSkeleton />
        ) : (
          <CandidatePicker
            candidates={candidates?.items ?? []}
            selectedCandidates={selectedCandidates}
            toggleCandidateSelection={toggleCandidateSelection}
          />
        )}
      </div>

      {!baseVacancy && (
        <div className="rounded-2xl border border-brand-border bg-surface px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-electric/10 text-electric">
                <Target className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-sm font-semibold text-ink">
                Asignar a vacante
              </h3>
            </div>
            <Select
              value={targetVacancyId}
              onValueChange={setTargetVacancyId}
            >
              <SelectTrigger className="flex-1 min-w-[240px] rounded-xl border-brand-border bg-canvas text-ink focus:border-electric focus:ring-electric/10">
                <SelectValue placeholder="Selecciona una vacante" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-brand-border bg-surface">
                {vacancies?.items.map((vacancy) => (
                  <SelectItem key={vacancy.id} value={vacancy.id.toString()}>
                    {vacancyDisplayLabel(vacancy)} - {vacancy.company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <DialogFooter className="flex flex-col lg:flex-row justify-between gap-2">
        <Button variant="brand-ghost" onClick={onBack}>
          Volver
        </Button>
        <Button
          variant="brand"
          disabled={!canSubmit}
          onClick={() => {
            if (baseVacancy) {
              handleSyncToBaseVacancy();
            } else {
              handleAssignToTarget();
            }
          }}
        >
          {isPending
            ? "Agregando..."
            : `Agregar a vacante (${selectedCandidates.length})`}
        </Button>
      </DialogFooter>
    </div>
  );
};
