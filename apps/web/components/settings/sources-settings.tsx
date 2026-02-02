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
  CANDIDATE_SOURCE_API_KEY,
  createCandidateSource,
  deleteCandidateSource,
  getAllCandidateSources,
  updateCandidateSource,
} from "@/lib/api/candidate-source";
import type { CandidateSource } from "@workspace/shared/types/candidate-source";

export default function SourcesSettings() {
  const queryClient = useQueryClient();

  const [newSource, setNewSource] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<CandidateSource | null>(null);
  const [sourceToDelete, setSourceToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: [CANDIDATE_SOURCE_API_KEY, { page: 1, limit: 1e9 }],
    queryFn: () => getAllCandidateSources({ page: 1, limit: 1e9 }),
  });

  const filteredSources = useMemo(() => {
    return data?.items.filter((source) =>
      source.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const { mutate: handleAddSource } = useMutation({
    mutationFn: async (name: string) => {
      const source = createCandidateSource({ name });
      setNewSource("");
      return source;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CANDIDATE_SOURCE_API_KEY] }).then(() => {
        setNewSource("");
        setIsAddDialogOpen(false);
        toast.success("Fuente creada correctamente");
      });
    },
    onError: () => {
      toast.error("Error al crear la fuente");
    },
  });

  const { mutate: handleEditSource } = useMutation({
    mutationFn: (source: CandidateSource) => updateCandidateSource(source.id, { name: source.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CANDIDATE_SOURCE_API_KEY] }).then(() => {
        setEditingSource(null);
        toast.success("Fuente actualizada correctamente");
      });
    },
    onError: () => {
      toast.error("Error al actualizar la fuente");
    },
  });

  const { mutate: handleDeleteSource } = useMutation({
    mutationFn: (id: number) => deleteCandidateSource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CANDIDATE_SOURCE_API_KEY] }).then(() => {
        setSourceToDelete(null);
        toast.success("Fuente eliminada correctamente");
      });
    },
    onError: () => {
      toast.error("Error al eliminar la fuente");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="w-full sm:w-1/2">
          <Input
            placeholder="Buscar fuentes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Agregar Fuente
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
              {filteredSources?.map((source) => (
                <TableRow key={source.id}>
                  <TableCell>{source.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingSource(source)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSourceToDelete(source.id)}
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
              <DialogTitle>Agregar Fuente</DialogTitle>
              <DialogDescription>
                Ingresa el nombre de la nueva fuente.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="Nombre de la fuente"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => handleAddSource(newSource)} disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {!!editingSource && (
        <Dialog open={!!editingSource} onOpenChange={() => setEditingSource(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Fuente</DialogTitle>
              <DialogDescription>
                Modifica el nombre de la fuente.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  value={editingSource?.name || ""}
                  onChange={(e) =>
                    setEditingSource(
                      editingSource
                        ? { ...editingSource, name: e.target.value }
                        : null
                    )
                  }
                  placeholder="Nombre de la fuente"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingSource(null)}
              >
                Cancelar
              </Button>
              <Button onClick={() => handleEditSource(editingSource!)} disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {!!sourceToDelete && (
        <AlertDialog
          open={!!sourceToDelete}
          onOpenChange={() => setSourceToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente
                la fuente y podría afectar a los postulantes que la tengan
                asignada.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteSource(sourceToDelete!)}
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
