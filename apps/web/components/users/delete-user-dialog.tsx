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
import { deleteUser, USERS_API_KEY } from "@/lib/api/user";
import type { User } from "@workspace/shared/types/user";

interface DeleteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export function DeleteUserDialog({
  isOpen,
  onClose,
  user,
}: DeleteUserDialogProps) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => deleteUser(user?.id.toString() || ""),
    onSuccess: () => {
      toast.success("Usuario eliminado exitosamente");
      queryClient
        .invalidateQueries({ queryKey: [USERS_API_KEY] })
        .then(onClose);
    },
  });
  const handleConfirm = () => {
    mutateAsync();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="rounded-2xl border-brand-border bg-surface">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold text-ink">¿Está seguro?</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-brand">
            Esta acción eliminará permanentemente el usuario{" "}
            <span className="font-semibold text-ink">{user?.name}</span> y no se puede
            deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl border-brand-border hover:border-electric/30 transition-all">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
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
