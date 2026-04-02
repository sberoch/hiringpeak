"use client";

import { useMemo, useState } from "react";
import { GripVertical, Pencil, PlusCircle, Trash2 } from "lucide-react";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  CANDIDATE_VACANCY_STATUS_API_KEY,
  createCandidateVacancyStatus,
  deleteCandidateVacancyStatus,
  getCandidateVacancyStatus,
  updateCandidateVacancyStatus,
} from "@/lib/api/candidate-vacancy-status";
import type { CandidateVacancyStatus } from "@workspace/shared/types/candidate-vacancy-status";
import type { PaginatedResponse } from "@workspace/shared/types/api";

function SortableStatusRow({
  status,
  onEdit,
  onDelete,
}: {
  status: CandidateVacancyStatus;
  onEdit: (status: CandidateVacancyStatus) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: status.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <div className="flex items-center gap-2">
          <button
            className="cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          {status.name}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(status)}>
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(status.id)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Eliminar</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function CandidateVacancyStatusesSettings() {
  const queryClient = useQueryClient();

  const [newStatus, setNewStatus] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] =
    useState<CandidateVacancyStatus | null>(null);
  const [statusToDelete, setStatusToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: [
      CANDIDATE_VACANCY_STATUS_API_KEY,
      { order: "sort:asc", limit: 1e9, page: 1 },
    ],
    queryFn: () =>
      getCandidateVacancyStatus({ order: "sort:asc", limit: 1e9, page: 1 }),
  });

  const filteredStatuses = useMemo(() => {
    return data?.items.filter((status) =>
      status.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { mutate: handleAddStatus } = useMutation({
    mutationFn: async (name: string) => {
      const status = createCandidateVacancyStatus({
        name,
        sort: 0,
        isInitial: false,
      });
      setNewStatus("");
      return status;
    },
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: [CANDIDATE_VACANCY_STATUS_API_KEY] })
        .then(() => {
          setNewStatus("");
          setIsAddDialogOpen(false);
          toast.success("Estado de candidato creado correctamente");
        });
    },
    onError: () => {
      toast.error("Error al crear el estado de candidato");
    },
  });

  const { mutate: handleEditStatus } = useMutation({
    mutationFn: (status: CandidateVacancyStatus) =>
      updateCandidateVacancyStatus(status.id, { name: status.name }),
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: [CANDIDATE_VACANCY_STATUS_API_KEY] })
        .then(() => {
          setEditingStatus(null);
          toast.success("Estado de candidato actualizado correctamente");
        });
    },
    onError: () => {
      toast.error("Error al actualizar el estado de candidato");
    },
  });

  const { mutate: handleDeleteStatus } = useMutation({
    mutationFn: (id: number) => deleteCandidateVacancyStatus(id.toString()),
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: [CANDIDATE_VACANCY_STATUS_API_KEY] })
        .then(() => {
          setStatusToDelete(null);
          toast.success("Estado de candidato eliminado correctamente");
        });
    },
    onError: () => {
      toast.error("Error al eliminar el estado de candidato");
    },
  });

  const { mutate: handleUpdateSort } = useMutation({
    mutationFn: async (status: CandidateVacancyStatus) =>
      updateCandidateVacancyStatus(status.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [CANDIDATE_VACANCY_STATUS_API_KEY],
      });
      toast.success("Orden actualizado correctamente");
    },
    onError: () => {
      toast.error("Error al actualizar el orden");
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && data?.items) {
      const oldIndex = data.items.findIndex((item) => item.id === active.id);
      const newIndex = data.items.findIndex((item) => item.id === over.id);
      const newItems = [...data.items];
      const [movedItem] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, movedItem!);

      queryClient.setQueryData(
        [
          CANDIDATE_VACANCY_STATUS_API_KEY,
          { order: "sort:asc", limit: 1e9, page: 1 },
        ],
        (oldData: PaginatedResponse<CandidateVacancyStatus> | undefined) => ({
          ...oldData,
          items: newItems,
        })
      );

      handleUpdateSort({ ...newItems[newIndex]!, sort: newIndex });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="w-full sm:w-1/2">
          <Input
            placeholder="Buscar estados de candidato..."
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="w-[100px] text-right">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext
                  items={filteredStatuses?.map((status) => status.id) || []}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredStatuses?.map((status) => (
                    <SortableStatusRow
                      key={status.id}
                      status={status}
                      onEdit={setEditingStatus}
                      onDelete={setStatusToDelete}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        )}
      </div>

      {isAddDialogOpen && (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Estado de Candidato</DialogTitle>
              <DialogDescription>
                Ingresa el nombre del nuevo estado de candidato.
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
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleAddStatus(newStatus)}
                disabled={isLoading}
              >
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {!!editingStatus && (
        <Dialog
          open={!!editingStatus}
          onOpenChange={() => setEditingStatus(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Estado de Candidato</DialogTitle>
              <DialogDescription>
                Modifica el nombre del estado de candidato.
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
              <Button variant="outline" onClick={() => setEditingStatus(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => handleEditStatus(editingStatus!)}
                disabled={isLoading}
              >
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
                el estado de candidato y podría afectar a los candidatos que lo
                tengan asignado.
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
