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
import { COMPANIES_API_KEY, deleteCompany } from "@/lib/api/company";
import type { Company } from "@workspace/shared/types/company";

interface DeleteCompanyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
}

export function DeleteCompanyDialog({
  isOpen,
  onClose,
  company,
}: DeleteCompanyDialogProps) {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => deleteCompany(company?.id.toString()),
    onSuccess: () => {
      toast.success("Empresa eliminada exitosamente");
      queryClient
        .invalidateQueries({ queryKey: [COMPANIES_API_KEY] })
        .then(onClose);
    },
  });

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente la empresa{" "}
            <span className="font-medium">{company?.name}</span> y no se puede
            deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => mutateAsync()}
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
