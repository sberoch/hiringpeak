"use client";

import { useMemo, useState } from "react";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  VACANCY_STATUS_API_KEY,
  createVacancyStatus,
  deleteVacancyStatus,
  getAllVacancyStatuses,
  updateVacancyStatus,
} from "@/lib/api/vacancy-status";
import type { VacancyStatus } from "@workspace/shared/types/vacancy-status";

export default function VacancyStatusesSettings() {
  const queryClient = useQueryClient();

  const [newStatus, setNewStatus] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<VacancyStatus | null>(null);
  const [statusToDelete, setStatusToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: [VACANCY_STATUS_API_KEY, { page: 1, limit: 1e9 }],
    queryFn: () => getAllVacancyStatuses({ page: 1, limit: 1e9 }),
  });

  const filteredStatuses = useMemo(() => {
    return data?.items.filter((status) =>
      status.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const { mutate: handleAddStatus } = useMutation({
    mutationFn: async (name: string) => {
      const status = createVacancyStatus({ name });
      setNewStatus("");
      return status;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VACANCY_STATUS_API_KEY] }).then(() => {
        setNewStatus("");
        setIsAddDialogOpen(false);
        toast.success("Estado de vacante creado correctamente");
      });
    },
    onError: () => {
      toast.error("Error al crear el estado de vacante");
    },
  });

  const { mutate: handleEditStatus } = useMutation({
    mutationFn: (status: VacancyStatus) => updateVacancyStatus(status.id, { name: status.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VACANCY_STATUS_API_KEY] }).then(() => {
        setEditingStatus(null);
        toast.success("Estado de vacante actualizado correctamente");
      });
    },
    onError: () => {
      toast.error("Error al actualizar el estado de vacante");
    },
  });

  const { mutate: handleDeleteStatus } = useMutation({
    mutationFn: (id: number) => deleteVacancyStatus(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VACANCY_STATUS_API_KEY] }).then(() => {
        setStatusToDelete(null);
        toast.success("Estado de vacante eliminado correctamente");
      });
    },
    onError: () => {
      toast.error("Error al eliminar el estado de vacante");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="w-full sm:w-1/2">
          <Input
            placeholder="Buscar estados de vacante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Agregar Estado
        </Button>
      </div>

      <div className="border rounded-md">
        {!data && isLoading ? (
          <div className="p-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="w-[100px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStatuses?.map((status) => (
                <TableRow key={status.id}>
                  <TableCell>{status.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingStatus(status)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setStatusToDelete(status.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {isAddDialogOpen && (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Estado de Vacante</DialogTitle>
              <DialogDescription>
                Ingresa el nombre del nuevo estado de vacante.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  placeholder="Nombre del estado"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => handleAddStatus(newStatus)} disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {!!editingStatus && (
        <Dialog open={!!editingStatus} onOpenChange={() => setEditingStatus(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Estado de Vacante</DialogTitle>
              <DialogDescription>
                Modifica el nombre del estado de vacante.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  value={editingStatus?.name || ""}
                  onChange={(e) =>
                    setEditingStatus(
                      editingStatus
                        ? { ...editingStatus, name: e.target.value }
                        : null
                    )
                  }
                  placeholder="Nombre del estado"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingStatus(null)}
              >
                Cancelar
              </Button>
              <Button onClick={() => handleEditStatus(editingStatus!)} disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {!!statusToDelete && (
        <AlertDialog
          open={!!statusToDelete}
          onOpenChange={() => setStatusToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente
                el estado de vacante y podría afectar a las vacantes que lo tengan
                asignado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteStatus(statusToDelete!)}
                disabled={isLoading}
              >
                {isLoading ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
