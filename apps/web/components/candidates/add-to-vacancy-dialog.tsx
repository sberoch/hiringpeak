"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { createCandidateVacancy } from "@/lib/api/candidate-vacancy";
import {
  CANDIDATE_VACANCY_STATUS_API_KEY,
  getCandidateVacancyStatus,
} from "@/lib/api/candidate-vacancy-status";
import { getAllVacancies, VACANCY_API_KEY } from "@/lib/api/vacancy";
import { vacancyDisplayLabel } from "@/lib/utils";

interface AddToVacancyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: number;
  candidateName: string;
}

export const AddToVacancyDialog = ({
  open,
  onOpenChange,
  candidateId,
  candidateName,
}: AddToVacancyDialogProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data } = useQuery({
    queryKey: [VACANCY_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllVacancies({ limit: 1e9, page: 1 }),
    enabled: open,
  });

  const { data: cvs } = useQuery({
    queryKey: [
      CANDIDATE_VACANCY_STATUS_API_KEY,
      { order: "sort:asc", limit: 1e9, page: 1 },
    ],
    queryFn: () =>
      getCandidateVacancyStatus({ order: "sort:asc", limit: 1e9, page: 1 }),
    enabled: open,
  });

  const [selectedVacancyId, setSelectedVacancyId] = useState<string>("");

  const { mutateAsync: handleAddToVacancy, isPending } = useMutation({
    mutationFn: () => {
      if (!selectedVacancyId) throw new Error("No vacancy selected");
      const defaultCvs = cvs?.items.find((cv) => cv.isInitial);
      if (!defaultCvs?.id) throw new Error("Error fetching vacancy status");

      return createCandidateVacancy({
        candidateId,
        vacancyId: parseInt(selectedVacancyId),
        candidateVacancyStatusId: defaultCvs.id,
        notes: "",
      });
    },
    onSuccess: () => {
      toast.success("Candidato agregado a la vacante correctamente.");
      queryClient.invalidateQueries({
        queryKey: [VACANCY_API_KEY, parseInt(selectedVacancyId)],
      });
      router.push(`/vacancies/${selectedVacancyId}`);
      onOpenChange(false);
      setSelectedVacancyId("");
    },
    onError: () => {
      toast.error("El candidato ya se encuentra en la vacante.");
    },
  });

  const handleConfirm = () => {
    if (selectedVacancyId) {
      handleAddToVacancy();
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedVacancyId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl border-brand-border bg-surface">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-ink">Agregar a vacante</DialogTitle>
          <DialogDescription className="text-slate-brand">
            Selecciona la vacante a la cual agregar a {candidateName}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4">
            <label className="text-sm font-medium text-ink mb-2 block">
              Seleccionar vacante
            </label>
            <Select
              value={selectedVacancyId}
              onValueChange={setSelectedVacancyId}
            >
              <SelectTrigger className="w-full rounded-xl border-brand-border bg-canvas text-ink focus:border-electric focus:ring-electric/10">
                <SelectValue placeholder="Selecciona una vacante" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-brand-border bg-surface">
                {data?.items.map((vacancy) => (
                  <SelectItem key={vacancy.id} value={vacancy.id.toString()}>
                    {vacancyDisplayLabel(vacancy)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="brand-ghost"
            onClick={handleCancel}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            disabled={!selectedVacancyId || isPending}
            onClick={handleConfirm}
            variant="brand"
          >
            {isPending ? "Agregando..." : "Agregar a vacante"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
