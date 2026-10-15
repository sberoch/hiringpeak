"use client";

import { useMemo, useState } from "react";
import { GripVertical, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  CONTACT_SOURCE_API_KEY,
  createContactSource,
  deleteContactSource,
  getContactSources,
  updateContactSource,
} from "@/lib/api/contact-source";
import type { ContactSource } from "@workspace/shared/types/contact-source";
import type { PaginatedResponse } from "@workspace/shared/types/api";

const SOURCES_QUERY = { order: "sort:asc", limit: 1e9, page: 1 };

function extractErrorMessage(error: unknown, fallback: string): string {
  const message = (
    error as { response?: { data?: { message?: string | string[] } } }
  )?.response?.data?.message;
  if (Array.isArray(message)) return message[0] ?? fallback;
  return message ?? fallback;
}

function SortableSourceRow({
  source,
  index,
  onEdit,
  onDelete,
}: {
  source: ContactSource;
  index: number;
  onEdit: (source: ContactSource) => void;
  onDelete: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: source.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between px-4 py-3 transition-colors duration-150 hover:bg-brand-border-light/50 ${
        index !== 0 ? "border-t border-brand-border" : ""
      } ${isDragging ? "z-10 bg-surface shadow-[0_4px_12px_rgba(0,0,0,0.08)] rounded-lg" : ""}`}
    >
      <div className="flex items-center gap-2.5">
        <button
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-brand cursor-grab transition-colors hover:text-slate-brand hover:bg-brand-border-light active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <span className="text-sm font-medium text-ink">{source.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(source)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-brand transition-colors hover:bg-electric/10 hover:text-electric"
        >
          <Pencil className="h-3.5 w-3.5" />
          <span className="sr-only">Editar</span>
        </button>
        <button
          onClick={() => onDelete(source.id)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-brand transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="sr-only">Eliminar</span>
        </button>
      </div>
    </li>
  );
}

export default function ContactSourcesSettings() {
  const queryClient = useQueryClient();

  const [newSource, setNewSource] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<ContactSource | null>(
    null,
  );
  const [sourceToDelete, setSourceToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: [CONTACT_SOURCE_API_KEY, SOURCES_QUERY],
    queryFn: () => getContactSources(SOURCES_QUERY),
  });

  const filteredSources = useMemo(() => {
    return data?.items.filter((source) =>
      source.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [data, searchTerm]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { mutate: handleAddSource } = useMutation({
    mutationFn: (name: string) =>
      createContactSource({ name, sort: data?.items.length ?? 0 }),
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: [CONTACT_SOURCE_API_KEY] })
        .then(() => {
          setNewSource("");
          setIsAddDialogOpen(false);
          toast.success("Origen creado correctamente");
        });
    },
    onError: () => {
      toast.error("Error al crear el origen");
    },
  });

  const { mutate: handleEditSource } = useMutation({
    mutationFn: (source: ContactSource) =>
      updateContactSource(source.id, { name: source.name }),
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: [CONTACT_SOURCE_API_KEY] })
        .then(() => {
          setEditingSource(null);
          toast.success("Origen actualizado correctamente");
        });
    },
    onError: () => {
      toast.error("Error al actualizar el origen");
    },
  });

  const { mutate: handleDeleteSource } = useMutation({
    mutationFn: (id: number) => deleteContactSource(id),
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: [CONTACT_SOURCE_API_KEY] })
        .then(() => {
          setSourceToDelete(null);
          toast.success("Origen eliminado correctamente");
        });
    },
    onError: (error) => {
      setSourceToDelete(null);
      toast.error(extractErrorMessage(error, "Error al eliminar el origen"));
    },
  });

  const { mutate: handleUpdateSort } = useMutation({
    mutationFn: (source: ContactSource) =>
      updateContactSource(source.id, { sort: source.sort }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTACT_SOURCE_API_KEY] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: [CONTACT_SOURCE_API_KEY] });
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
        [CONTACT_SOURCE_API_KEY, SOURCES_QUERY],
        (oldData: PaginatedResponse<ContactSource> | undefined) => ({
          ...oldData,
          items: newItems,
        }),
      );

      handleUpdateSort({ ...newItems[newIndex]!, sort: newIndex });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-brand" />
          <input
            placeholder="Buscar orígenes..."
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

      {data && !isLoading && (
        <p className="text-xs text-muted-brand">Arrastra para reordenar</p>
      )}

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
              No se encontraron orígenes con ese nombre.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <ul>
              <SortableContext
                items={filteredSources?.map((source) => source.id) || []}
                strategy={verticalListSortingStrategy}
              >
                {filteredSources?.map((source, index) => (
                  <SortableSourceRow
                    key={source.id}
                    source={source}
                    index={index}
                    onEdit={setEditingSource}
                    onDelete={setSourceToDelete}
                  />
                ))}
              </SortableContext>
            </ul>
          </DndContext>
        )}
      </div>

      {isAddDialogOpen && (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="text-ink">
                Agregar origen de contacto
              </DialogTitle>
              <DialogDescription className="text-slate-brand">
                Ingresa el nombre del nuevo origen de contacto.
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
                placeholder="Nombre del origen"
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
              <DialogTitle className="text-ink">
                Editar origen de contacto
              </DialogTitle>
              <DialogDescription className="text-slate-brand">
                Modifica el nombre del origen de contacto.
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
                placeholder="Nombre del origen"
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
                Esta acción no se puede deshacer. No podrás eliminar un origen
                que tenga contactos asignados.
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
