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
import { deleteCandidate, CANDIDATE_API_KEY } from "@/lib/api/candidate";
import type { Candidate } from "@workspace/shared/types/candidate";

interface DeleteCandidateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

export function DeleteCandidateDialog({
  isOpen,
  onClose,
  candidate,
}: DeleteCandidateDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCandidate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CANDIDATE_API_KEY] });
      toast.success("Candidato eliminado exitosamente");
      onClose();
    },
    onError: (error) => {
      console.error("Error deleting candidate:", error);
      toast.error("Error al eliminar el candidato");
    },
  });

  const handleConfirm = () => {
    if (candidate?.id) {
      deleteMutation.mutate(candidate.id);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente el candidato{" "}
            <span className="font-medium">{candidate?.name}</span> y no se puede
            deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
