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
  const [editingSeniority, setEditingSeniority] = useState<Seniority | null>(
    null,
  );
  const [seniorityToDelete, setSeniorityToDelete] = useState<number | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: [SENIORITY_API_KEY, { page: 1, limit: 1e9 }],
    queryFn: () => getAllSeniorities({ page: 1, limit: 1e9 }),
  });

  const filteredSeniorities = useMemo(() => {
    return data?.items.filter((seniority) =>
      seniority.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [data, searchTerm]);

  const { mutate: handleAddSeniority } = useMutation({
    mutationFn: (name: string) => createSeniority({ name }),
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: [SENIORITY_API_KEY] })
        .then(() => {
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
    mutationFn: (seniority: Seniority) =>
      updateSeniority(seniority.id, { name: seniority.name }),
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: [SENIORITY_API_KEY] })
        .then(() => {
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
      queryClient
        .invalidateQueries({ queryKey: [SENIORITY_API_KEY] })
        .then(() => {
          setSeniorityToDelete(null);
          toast.success("Seniority eliminado correctamente");
        });
    },
    onError: () => {
      toast.error("Error al eliminar el seniority");
    },
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-brand" />
          <input
            placeholder="Buscar seniorities..."
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

      {/* List */}
      <div className="rounded-xl border border-brand-border overflow-hidden">
        {!data && isLoading ? (
          <div className="p-3 space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredSeniorities?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-border-light mb-3">
              <Search className="h-5 w-5 text-muted-brand" />
            </div>
            <p className="text-sm font-medium text-ink">Sin resultados</p>
            <p className="text-xs text-muted-brand mt-0.5">
              No se encontraron seniorities con ese nombre.
            </p>
          </div>
        ) : (
          <ul>
            {filteredSeniorities?.map((seniority, index) => (
              <li
                key={seniority.id}
                className={`group flex items-center justify-between px-4 py-3 transition-colors duration-150 hover:bg-brand-border-light/50 ${
                  index !== 0 ? "border-t border-brand-border" : ""
                }`}
              >
                <span className="text-sm font-medium text-ink">
                  {seniority.name}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setEditingSeniority(seniority)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-brand transition-colors hover:bg-electric/10 hover:text-electric"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="sr-only">Editar</span>
                  </button>
                  <button
                    onClick={() => setSeniorityToDelete(seniority.id)}
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

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-ink">Agregar Seniority</DialogTitle>
            <DialogDescription className="text-slate-brand">
              Ingresa el nombre del nuevo seniority.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name" className="text-sm font-semibold text-ink">
              Nombre
            </Label>
            <Input
              id="name"
              value={newSeniority}
              onChange={(e) => setNewSeniority(e.target.value)}
              placeholder="Seniority"
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
              onClick={() => handleAddSeniority(newSeniority)}
              disabled={isLoading || !newSeniority.trim()}
              className="inline-flex items-center justify-center rounded-md bg-electric px-4 py-2 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-electric-light hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.4)] disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? "Guardando..." : "Guardar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingSeniority}
        onOpenChange={() => setEditingSeniority(null)}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-ink">Editar Seniority</DialogTitle>
            <DialogDescription className="text-slate-brand">
              Modifica el nombre del seniority.
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
              value={editingSeniority?.name || ""}
              onChange={(e) =>
                setEditingSeniority(
                  editingSeniority
                    ? { ...editingSeniority, name: e.target.value }
                    : null,
                )
              }
              placeholder="Seniority"
              className="mt-2 rounded-xl border-brand-border bg-canvas focus:border-electric focus:ring-electric/10"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingSeniority(null)}
              className="rounded-md border-brand-border text-ink hover:bg-brand-border-light"
            >
              Cancelar
            </Button>
            <button
              onClick={() => handleEditSeniority(editingSeniority!)}
              disabled={isLoading || !editingSeniority?.name.trim()}
              className="inline-flex items-center justify-center rounded-md bg-electric px-4 py-2 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-electric-light hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.4)] disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? "Guardando..." : "Guardar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!seniorityToDelete}
        onOpenChange={() => setSeniorityToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-ink">
              ¿Estás seguro?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-brand">
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              el seniority y podría afectar a los postulantes que lo tengan
              asignado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-md border-brand-border">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteSeniority(seniorityToDelete!)}
              disabled={isLoading}
              className="rounded-md bg-red-500 text-white hover:bg-red-600"
            >
              {isLoading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
