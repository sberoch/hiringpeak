"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { createCandidateVacancy } from "@/lib/api/candidate-vacancy";
import {
  CANDIDATE_VACANCY_STATUS_API_KEY,
  getAllCandidateVacancyStatus,
} from "@/lib/api/candidate-vacancy-status";
import { getAllVacancies, VACANCY_API_KEY } from "@/lib/api/vacancy";
import { vacancyDisplayLabel } from "@/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { DialogFooter } from "@workspace/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

interface SimulateVacancyTargetSelectionProps {
  onBack: () => void;
  onSuccess: () => void;
  selectedCandidates: number[];
}

export const SimulateVacancyTargetSelection = ({
  onBack,
  onSuccess,
  selectedCandidates,
}: SimulateVacancyTargetSelectionProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: [VACANCY_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllVacancies({ limit: 1e9, page: 1 }),
  });

  const { data: cvs } = useQuery({
    queryKey: [
      CANDIDATE_VACANCY_STATUS_API_KEY,
      { order: "sort:asc", limit: 1e9, page: 1 },
    ],
    queryFn: () =>
      getAllCandidateVacancyStatus({ order: "sort:asc", limit: 1e9, page: 1 }),
  });

  const [selectedVacancyId, setSelectedVacancyId] = useState<string>("");

  const { mutateAsync: handleAddCandidates, isPending } = useMutation({
    mutationFn: () => {
      if (!selectedVacancyId) throw new Error("No vacancy selected");
      const defaultCvs = cvs?.items.find((cv) => cv.isInitial);
      if (!defaultCvs?.id) throw new Error("Error fetching vacancy status");

      return Promise.all(
        selectedCandidates.map((candidateId) =>
          createCandidateVacancy({
            candidateId,
            vacancyId: parseInt(selectedVacancyId),
            candidateVacancyStatusId: defaultCvs.id,
            notes: "",
          })
        )
      );
    },
    onSuccess: () => {
      toast.success("Candidatos agregados correctamente");
      queryClient
        .invalidateQueries({
          queryKey: [VACANCY_API_KEY, parseInt(selectedVacancyId)],
        })
        .then(() => {
          router.push(`/vacancies/${selectedVacancyId}`);
          onSuccess();
        });
    },
    onError: () => {
      toast.error("Ha ocurrido un error, intente nuevamente");
    },
  });

  const handleContinue = () => {
    if (selectedVacancyId) {
      handleAddCandidates();
    }
  };

  return (
    <>
      <div className="text-gray-700 mb-4">
        Selecciona la vacante a la cual agregar los {selectedCandidates.length}{" "}
        candidatos elegidos.
      </div>

      <div className="mb-6">
        <h3 className="text-md font-medium mb-3">Seleccionar vacante</h3>
        <Select value={selectedVacancyId} onValueChange={setSelectedVacancyId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona una vacante" />
          </SelectTrigger>
          <SelectContent>
            {data?.items.map((vacancy) => (
              <SelectItem key={vacancy.id} value={vacancy.id.toString()}>
                {vacancyDisplayLabel(vacancy)} - {vacancy.company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter className="flex flex-col lg:flex-row justify-between gap-2">
        <Button variant="outline" onClick={onBack}>
          Volver
        </Button>
        <Button
          variant="default"
          disabled={!selectedVacancyId || isPending}
          onClick={handleContinue}
        >
          {isPending ? "Agregando..." : "Agregar candidatos a vacante"}
        </Button>
      </DialogFooter>
    </>
  );
};
