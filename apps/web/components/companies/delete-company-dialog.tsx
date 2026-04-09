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
  onDeleted?: () => void;
  company: Company;
}

export function DeleteCompanyDialog({
  isOpen,
  onClose,
  onDeleted,
  company,
}: DeleteCompanyDialogProps) {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => deleteCompany(company?.id.toString()),
    onSuccess: () => {
      toast.success("Empresa eliminada exitosamente");
      queryClient
        .invalidateQueries({ queryKey: [COMPANIES_API_KEY] })
        .then(() => {
          onClose();
          onDeleted?.();
        });
    },
  });

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="rounded-2xl border-brand-border bg-surface">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold text-ink">¿Está seguro?</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-brand">
            Esta acción eliminará permanentemente la empresa{" "}
            <span className="font-semibold text-ink">{company?.name}</span> y no se puede
            deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl border-brand-border hover:border-electric/30 transition-all">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => mutateAsync()}
            className="bg-red-600 hover:bg-red-700 rounded-xl transition-all"
            disabled={isPending}
          >
            {isPending ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
