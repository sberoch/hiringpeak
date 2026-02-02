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
import { deleteVacancy, VACANCY_API_KEY } from "@/lib/api/vacancy";
import type { Vacancy } from "@workspace/shared/types/vacancy";

interface DeleteVacancyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vacancy: Vacancy | null;
}

export function DeleteVacancyDialog({
  isOpen,
  onClose,
  vacancy,
}: DeleteVacancyDialogProps) {
  const queryClient = useQueryClient();

  const { mutate: deleteVacancyMutation, isPending } = useMutation({
    mutationFn: (id: string) => deleteVacancy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VACANCY_API_KEY] });
      toast.success("Vacante eliminada exitosamente");
      onClose();
    },
    onError: () => {
      toast.error("Error al eliminar la vacante");
    },
  });

  const handleConfirm = () => {
    if (vacancy?.id) {
      deleteVacancyMutation(vacancy.id.toString());
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente la vacante{" "}
            <span className="font-medium">{vacancy?.title}</span> y no se puede
            deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700"
            disabled={isPending}
          >
            {isPending ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
