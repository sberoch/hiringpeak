"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteTask, TASK_API_KEY } from "@/lib/api/tasks";
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
import type { TaskWithRelations } from "@workspace/shared/types/task";

interface DeleteTaskDialogProps {
  task: TaskWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteTaskDialog({
  task,
  isOpen,
  onClose,
}: DeleteTaskDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASK_API_KEY] });
      toast.success("Tarea eliminada");
      onClose();
    },
    onError: () => toast.error("No se pudo eliminar la tarea"),
  });

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="rounded-2xl border-brand-border bg-surface">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold text-ink">
            ¿Eliminar tarea?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-brand">
            Esta acción eliminará la tarea{" "}
            <span className="font-semibold text-ink">{task?.title}</span> de
            forma permanente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl border-brand-border">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => task && deleteMutation.mutate(task.id)}
            className="bg-red-600 hover:bg-red-700 rounded-xl"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
