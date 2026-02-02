"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import {
  deleteCandidateVacancy,
  CANDIDATE_VACANCY_API_KEY,
} from "@/lib/api/candidate-vacancy";
import type { CandidateVacancy, ListedCandidateVacancy } from "@workspace/shared/types/vacancy";

interface RemoveCandidateFromVacancyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  candidateVacancy: CandidateVacancy | ListedCandidateVacancy | null;
  vacancyId?: string;
}

export function RemoveCandidateFromVacancyDialog({
  isOpen,
  onClose,
  candidateVacancy,
  vacancyId,
}: RemoveCandidateFromVacancyDialogProps) {
  const queryClient = useQueryClient();

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteCandidateVacancy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CANDIDATE_VACANCY_API_KEY] });
      if (vacancyId) {
        queryClient.invalidateQueries({ queryKey: ["vacancy", vacancyId] });
      }
      toast.success("Candidato eliminado de la vacante exitosamente");
      onClose();
    },
    onError: (error) => {
      console.error("Error removing candidate from vacancy:", error);
      toast.error("Error al eliminar el candidato de la vacante");
    },
  });

  const handleConfirm = () => {
    if (candidateVacancy?.id) {
      removeMutation.mutate(candidateVacancy.id.toString());
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Eliminar candidato de la vacante?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará a{" "}
            <span className="font-medium">
              {candidateVacancy?.candidate.name}
            </span>{" "}
            de esta vacante. El candidato seguirá existiendo en el sistema pero
            ya no estará asociado a esta vacante.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700"
            disabled={removeMutation.isPending}
          >
            {removeMutation.isPending ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
