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
  SENIORITY_API_KEY,
  createSeniority,
  deleteSeniority,
  getAllSeniorities,
  updateSeniority,
} from "@/lib/api/seniority";
import type { Seniority } from "@workspace/shared/types/seniority";

export default function SenioritiesSettings() {
  const queryClient = useQueryClient();

  const [newSeniority, setNewSeniority] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSeniority, setEditingSeniority] = useState<Seniority | null>(null);
  const [seniorityToDelete, setSeniorityToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: [SENIORITY_API_KEY, { page: 1, limit: 1e9 }],
    queryFn: () => getAllSeniorities({ page: 1, limit: 1e9 }),
  });

  const filteredSeniorities = useMemo(() => {
    return data?.items.filter((seniority) =>
      seniority.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const { mutate: handleAddSeniority } = useMutation({
    mutationFn: (name: string) => createSeniority({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SENIORITY_API_KEY] }).then(() => {
        setIsAddDialogOpen(false);
        setNewSeniority("");
        toast.success("Seniority creado correctamente");
      });
    },
    onError: () => {
      toast.error("Error al crear el seniority");
    },
  });

  const { mutate: handleEditSeniority } = useMutation({
    mutationFn: (seniority: Seniority) => updateSeniority(seniority.id, { name: seniority.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SENIORITY_API_KEY] }).then(() => {
        setEditingSeniority(null);
        toast.success("Seniority actualizado correctamente");
      });
    },
    onError: () => {
      toast.error("Error al actualizar el seniority");
    },
  });

  const { mutate: handleDeleteSeniority } = useMutation({
    mutationFn: (id: number) => deleteSeniority(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SENIORITY_API_KEY] }).then(() => {
        setSeniorityToDelete(null);
        toast.success("Seniority eliminado correctamente");
      });
    },
    onError: () => {
      toast.error("Error al eliminar el seniority");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="w-full sm:w-1/2">
          <Input
            placeholder="Buscar seniorities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Agregar Seniority
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
              {filteredSeniorities?.map((seniority) => (
                <TableRow key={seniority.id}>
                  <TableCell>{seniority.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingSeniority(seniority)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSeniorityToDelete(seniority.id)}
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

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Seniority</DialogTitle>
            <DialogDescription>
              Ingresa el nombre del nuevo seniority.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={newSeniority}
                onChange={(e) => setNewSeniority(e.target.value)}
                placeholder="Seniority"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleAddSeniority(newSeniority)} disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingSeniority} onOpenChange={() => setEditingSeniority(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Seniority</DialogTitle>
            <DialogDescription>
              Modifica el nombre del seniority.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={editingSeniority?.name || ""}
                onChange={(e) =>
                  setEditingSeniority(
                    editingSeniority
                      ? { ...editingSeniority, name: e.target.value }
                      : null
                  )
                }
                placeholder="Seniority"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingSeniority(null)}
            >
              Cancelar
            </Button>
            <Button onClick={() => handleEditSeniority(editingSeniority!)} disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!seniorityToDelete}
        onOpenChange={() => setSeniorityToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              el seniority y podría afectar a los postulantes que lo tengan
              asignado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteSeniority(seniorityToDelete!)}
              disabled={isLoading}
            >
              {isLoading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
