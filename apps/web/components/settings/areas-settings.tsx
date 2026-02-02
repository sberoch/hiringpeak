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
  AREAS_API_KEY,
  createArea,
  deleteArea,
  getAllAreas,
  updateArea,
} from "@/lib/api/area";
import type { Area } from "@workspace/shared/types/area";

export default function AreasSettings() {
  const queryClient = useQueryClient();

  const [newArea, setNewArea] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [areaToDelete, setAreaToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: [AREAS_API_KEY, { page: 1, limit: 1e9 }],
    queryFn: () => getAllAreas({ page: 1, limit: 1e9 }),
  });

  const filteredAreas = useMemo(() => {
    return data?.items.filter((area) =>
      area.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const { mutate: handleAddArea } = useMutation({
    mutationFn: async (name: string) => {
      const area = createArea({ name });
      setNewArea("");
      return area;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AREAS_API_KEY] }).then(() => {
        setIsAddDialogOpen(false);
        toast.success("Área creada correctamente");
      });
    },
    onError: () => {
      toast.error("Error al crear el área");
    },
  });

  const { mutate: handleEditArea } = useMutation({
    mutationFn: (area: Area) => updateArea(area.id, { name: area.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AREAS_API_KEY] }).then(() => {
        setEditingArea(null);
        toast.success("Área actualizada correctamente");
      });
    },
    onError: () => {
      toast.error("Error al actualizar el área");
    },
  });

  const { mutate: handleDeleteArea } = useMutation({
    mutationFn: (id: Area["id"]) => deleteArea(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AREAS_API_KEY] }).then(() => {
        setAreaToDelete(null);
        toast.success("Área eliminada correctamente");
      });
    },
    onError: () => {
      toast.error("Error al eliminar el área");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="w-full sm:w-1/2">
          <Input
            placeholder="Buscar áreas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Agregar Área
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
              {filteredAreas?.map((area) => (
                <TableRow key={area.id}>
                  <TableCell>{area.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingArea(area)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAreaToDelete(area.id)}
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
              <DialogTitle>Agregar Área</DialogTitle>
              <DialogDescription>
                Ingresa el nombre de la nueva área.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  placeholder="Nombre del área"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => handleAddArea(newArea)} disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {!!editingArea && (
        <Dialog open={!!editingArea} onOpenChange={() => setEditingArea(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Área</DialogTitle>
              <DialogDescription>Modifica el nombre del área.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  value={editingArea?.name || ""}
                  onChange={(e) =>
                    setEditingArea(
                      editingArea
                        ? { ...editingArea, name: e.target.value }
                        : null
                    )
                  }
                  placeholder="Nombre del área"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingArea(null)}
              >
                Cancelar
              </Button>
              <Button onClick={() => handleEditArea(editingArea!)} disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {!!areaToDelete && (
        <AlertDialog
          open={!!areaToDelete}
          onOpenChange={() => setAreaToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente
                el área y podría afectar a los postulantes que la tengan asignada.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeleteArea(areaToDelete!)} disabled={isLoading}>
                {isLoading ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
