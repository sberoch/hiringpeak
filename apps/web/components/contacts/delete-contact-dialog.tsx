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
import type { ContactView } from "@workspace/shared/types/contact";
import { COMPANIES_API_KEY } from "@/lib/api/company";
import { CONTACT_API_KEY, deleteContact } from "@/lib/api/contact";
import { INTERACTION_API_KEY } from "@/lib/api/interaction";
import { OPPORTUNITY_API_KEY } from "@/lib/api/opportunity";
import { TASK_API_KEY } from "@/lib/api/tasks";
import { VACANCY_API_KEY } from "@/lib/api/vacancy";

interface DeleteContactDialogProps {
  contact: ContactView | null;
  onClose: () => void;
  /** Called after the Contact is gone (e.g. leave their page). */
  onDeleted?: () => void;
}

export function DeleteContactDialog({
  contact,
  onClose,
  onDeleted,
}: DeleteContactDialogProps) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (id: number) => deleteContact(id),
    onSuccess: (deleted) => {
      toast.success(`${deleted.name} eliminado`);
      queryClient.invalidateQueries({ queryKey: [COMPANIES_API_KEY] });
      queryClient.invalidateQueries({ queryKey: [VACANCY_API_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTACT_API_KEY] });
      queryClient.invalidateQueries({ queryKey: [INTERACTION_API_KEY] });
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_API_KEY] });
      queryClient.invalidateQueries({ queryKey: [TASK_API_KEY] });
      onClose();
      onDeleted?.();
    },
    onError: () => {
      toast.error("No se pudo eliminar el contacto.");
    },
  });

  return (
    <AlertDialog open={!!contact} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="rounded-2xl border-brand-border bg-surface">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold text-ink">
            ¿Eliminar a {contact?.name}?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-brand">
            Sale de sus interacciones, oportunidades y tareas, y deja de ser
            contacto de cualquier vacante. Las interacciones, oportunidades,
            tareas y vacantes no se borran; sus tareas siguen siendo
            comerciales.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl border-brand-border">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              if (contact) mutate(contact.id);
            }}
            className="rounded-xl bg-red-600 hover:bg-red-700"
            disabled={isPending}
          >
            {isPending ? "Eliminando..." : "Eliminar contacto"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
