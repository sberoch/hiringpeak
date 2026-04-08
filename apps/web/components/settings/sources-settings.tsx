"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
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
  const [editingSource, setEditingSource] = useState<CandidateSource | null>(
    null,
  );
  const [sourceToDelete, setSourceToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: [CANDIDATE_SOURCE_API_KEY, { page: 1, limit: 1e9 }],
    queryFn: () => getAllCandidateSources({ page: 1, limit: 1e9 }),
  });

  const filteredSources = useMemo(() => {
    return data?.items.filter((source) =>
      source.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [data, searchTerm]);

  const { mutate: handleAddSource } = useMutation({
    mutationFn: async (name: string) => {
      const source = createCandidateSource({ name });
      setNewSource("");
      return source;
    },
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: [CANDIDATE_SOURCE_API_KEY] })
        .then(() => {
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
    mutationFn: (source: CandidateSource) =>
      updateCandidateSource(source.id, { name: source.name }),
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: [CANDIDATE_SOURCE_API_KEY] })
        .then(() => {
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
      queryClient
        .invalidateQueries({ queryKey: [CANDIDATE_SOURCE_API_KEY] })
        .then(() => {
          setSourceToDelete(null);
          toast.success("Fuente eliminada correctamente");
        });
    },
    onError: () => {
      toast.error("Error al eliminar la fuente");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-brand" />
          <input
            placeholder="Buscar fuentes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-brand-border bg-canvas py-2.5 pl-9 pr-4 text-sm text-ink outline-none placeholder:text-muted-brand transition-all duration-200 focus:border-electric focus:shadow-[0_0_0_4px_rgba(0,102,255,0.08)]"
          />
        </div>
        <button
          onClick={() => setIsAddDialogOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-electric px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-electric-light hover:shadow-[0_12px_32px_-8px_rgba(0,102,255,0.4)]"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </div>

      <div className="rounded-xl border border-brand-border overflow-hidden">
        {!data && isLoading ? (
          <div className="p-3 space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredSources?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-border-light mb-3">
              <Search className="h-5 w-5 text-muted-brand" />
            </div>
            <p className="text-sm font-medium text-ink">Sin resultados</p>
            <p className="text-xs text-muted-brand mt-0.5">
              No se encontraron fuentes con ese nombre.
            </p>
          </div>
        ) : (
          <ul>
            {filteredSources?.map((source, index) => (
              <li
                key={source.id}
                className={`group flex items-center justify-between px-4 py-3 transition-colors duration-150 hover:bg-brand-border-light/50 ${
                  index !== 0 ? "border-t border-brand-border" : ""
                }`}
              >
                <span className="text-sm font-medium text-ink">
                  {source.name}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setEditingSource(source)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-brand transition-colors hover:bg-electric/10 hover:text-electric"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="sr-only">Editar</span>
                  </button>
                  <button
                    onClick={() => setSourceToDelete(source.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-brand transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Eliminar</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isAddDialogOpen && (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="text-ink">Agregar Fuente</DialogTitle>
              <DialogDescription className="text-slate-brand">
                Ingresa el nombre de la nueva fuente.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="name" className="text-sm font-semibold text-ink">
                Nombre
              </Label>
              <Input
                id="name"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                placeholder="Nombre de la fuente"
                className="mt-2 rounded-xl border-brand-border bg-canvas focus:border-electric focus:ring-electric/10"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="rounded-md border-brand-border text-ink hover:bg-brand-border-light"
              >
                Cancelar
              </Button>
              <button
                onClick={() => handleAddSource(newSource)}
                disabled={isLoading || !newSource.trim()}
                className="inline-flex items-center justify-center rounded-md bg-electric px-4 py-2 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-electric-light hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.4)] disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? "Guardando..." : "Guardar"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {!!editingSource && (
        <Dialog
          open={!!editingSource}
          onOpenChange={() => setEditingSource(null)}
        >
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="text-ink">Editar Fuente</DialogTitle>
              <DialogDescription className="text-slate-brand">
                Modifica el nombre de la fuente de reclutamiento.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label
                htmlFor="edit-name"
                className="text-sm font-semibold text-ink"
              >
                Nombre
              </Label>
              <Input
                id="edit-name"
                value={editingSource?.name || ""}
                onChange={(e) =>
                  setEditingSource(
                    editingSource
                      ? { ...editingSource, name: e.target.value }
                      : null,
                  )
                }
                placeholder="Nombre de la fuente"
                className="mt-2 rounded-xl border-brand-border bg-canvas focus:border-electric focus:ring-electric/10"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingSource(null)}
                className="rounded-md border-brand-border text-ink hover:bg-brand-border-light"
              >
                Cancelar
              </Button>
              <button
                onClick={() => handleEditSource(editingSource!)}
                disabled={isLoading || !editingSource?.name.trim()}
                className="inline-flex items-center justify-center rounded-md bg-electric px-4 py-2 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-electric-light hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.4)] disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? "Guardando..." : "Guardar"}
              </button>
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
              <AlertDialogTitle className="text-ink">
                ¿Estás seguro?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-brand">
                Esta acción no se puede deshacer. Esto eliminará permanentemente
                la fuente y podría afectar a los postulantes que la tengan
                asignada.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-md border-brand-border">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteSource(sourceToDelete!)}
                disabled={isLoading}
                className="rounded-md bg-red-500 text-white hover:bg-red-600"
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
