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
import { CONTACT_API_KEY } from "@/lib/api/contact";
import { INTERACTION_API_KEY } from "@/lib/api/interaction";
import { TASK_API_KEY } from "@/lib/api/tasks";
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
      toast.success("Empresa eliminada exitosamente", {
        description: "Sus contactos siguen en Contactos, sin empresa.",
      });
      for (const key of [CONTACT_API_KEY, INTERACTION_API_KEY, TASK_API_KEY]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
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
          <AlertDialogTitle className="text-lg font-bold text-ink">
            ¿Está seguro?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-slate-brand">
              <p>
                Se borra la empresa{" "}
                <span className="font-semibold text-ink">{company?.name}</span>{" "}
                con sus oportunidades, sus vacantes y las interacciones que no
                tuvieron ningún contacto. No se puede deshacer.
              </p>
              <p>
                Las personas no se borran: sus contactos quedan sin empresa, y
                las interacciones con algún contacto quedan en el historial de
                esa persona, sin empresa. Sus tareas siguen, sin el vínculo.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl border-brand-border hover:border-electric/30 transition-all">
            Cancelar
          </AlertDialogCancel>
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
