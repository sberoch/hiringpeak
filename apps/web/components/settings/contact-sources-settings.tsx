"use client";

import { useMemo, useState } from "react";
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
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
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import type { PaginatedResponse } from "@workspace/shared/types/api";
import type { ContactSourceWithUsage } from "@workspace/shared/types/contact-source";
import { apiErrorMessage } from "@/components/opportunities/opportunity-ui";
import { CONTACT_API_KEY } from "@/lib/api/contact";
import {
  ALL_CONTACT_SOURCES,
  CONTACT_SOURCE_API_KEY,
  createContactSource,
  deleteContactSource,
  getContactSources,
  updateContactSource,
} from "@/lib/api/contact-source";
import {
  NameDialog,
  NoResults,
  RowIconButton,
  SettingsToolbar,
  UsagePill,
  useListSensors,
} from "./commercial-settings-shared";

type Source = ContactSourceWithUsage;

const QUERY_KEY = [CONTACT_SOURCE_API_KEY, ALL_CONTACT_SOURCES];

function SourceRow({
  source,
  first,
  dragDisabled,
  onEdit,
  onDelete,
}: {
  source: Source;
  first: boolean;
  dragDisabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: source.id, disabled: dragDisabled });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center justify-between px-4 py-3 transition-colors duration-150 hover:bg-brand-border-light/50",
        !first && "border-t border-brand-border",
        isDragging &&
          "z-10 rounded-lg bg-surface shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          className={cn(
            "flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-brand transition-colors hover:bg-brand-border-light hover:text-slate-brand active:cursor-grabbing",
            dragDisabled && "cursor-not-allowed opacity-40",
          )}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <span className="truncate text-sm font-medium text-ink">
          {source.name}
        </span>
        <UsagePill n={source.contactCount} one="contacto" many="contactos" />
      </div>
      <div className="flex items-center gap-1">
        <RowIconButton title="Editar" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </RowIconButton>
        <RowIconButton danger title="Eliminar" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </RowIconButton>
      </div>
    </li>
  );
}

/** "Orígenes de contacto": a sortable list, built like "Motivos de pérdida". */
export default function ContactSourcesSettings() {
  const queryClient = useQueryClient();
  const sensors = useListSensors();
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Source | null>(null);
  const [deleting, setDeleting] = useState<Source | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => getContactSources(ALL_CONTACT_SOURCES),
  });

  const sources = useMemo(() => data?.items ?? [], [data]);
  const term = search.trim().toLowerCase();
  const shown = sources.filter((source) =>
    source.name.toLowerCase().includes(term),
  );

  // Source names show on Contacts, so refresh those too.
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [CONTACT_SOURCE_API_KEY] }),
      queryClient.invalidateQueries({ queryKey: [CONTACT_API_KEY] }),
    ]);

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      createContactSource({ name, sort: sources.length }),
    onSuccess: async () => {
      await invalidate();
      setAdding(false);
      toast.success("Origen creado correctamente");
    },
    onError: (err) =>
      toast.error(apiErrorMessage(err, "Error al crear el origen")),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      updateContactSource(id, { name }),
    onSuccess: async () => {
      await invalidate();
      setEditing(null);
      toast.success("Origen actualizado correctamente");
    },
    onError: (err) =>
      toast.error(apiErrorMessage(err, "Error al actualizar el origen")),
  });

  const reorderMutation = useMutation({
    mutationFn: ({ id, sort }: { id: number; sort: number }) =>
      updateContactSource(id, { sort }),
    onSettled: invalidate,
    onError: (err) =>
      toast.error(apiErrorMessage(err, "Error al actualizar el orden")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteContactSource(id),
    onSuccess: async () => {
      await invalidate();
      toast.success("Origen eliminado correctamente");
    },
    onError: (err) =>
      toast.error(apiErrorMessage(err, "Error al eliminar el origen")),
    onSettled: () => setDeleting(null),
  });

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || !data) return;
    const from = sources.findIndex((source) => source.id === active.id);
    const to = sources.findIndex((source) => source.id === over.id);
    if (from < 0 || to < 0) return;
    queryClient.setQueryData<PaginatedResponse<Source>>(QUERY_KEY, {
      ...data,
      items: arrayMove(sources, from, to).map((source, sort) => ({
        ...source,
        sort,
      })),
    });
    reorderMutation.mutate({ id: Number(active.id), sort: to });
  };

  const deletingCount = deleting?.contactCount ?? 0;

  return (
    <div className="space-y-4">
      <SettingsToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar orígenes..."
        onAdd={() => setAdding(true)}
      />
      {data && (
        <p className="text-xs text-muted-brand">
          {term
            ? "Borrá la búsqueda para reordenar"
            : "Arrastrá para reordenar"}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-brand-border">
        {!data && isLoading ? (
          <div className="space-y-2 p-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <NoResults
            text={
              term
                ? "No se encontraron orígenes con ese nombre."
                : "Todavía no hay orígenes."
            }
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <ul>
              <SortableContext
                items={shown.map((source) => source.id)}
                strategy={verticalListSortingStrategy}
              >
                {shown.map((source, i) => (
                  <SourceRow
                    key={source.id}
                    source={source}
                    first={i === 0}
                    dragDisabled={!!term}
                    onEdit={() => setEditing(source)}
                    onDelete={() => setDeleting(source)}
                  />
                ))}
              </SortableContext>
            </ul>
          </DndContext>
        )}
      </div>

      <NameDialog
        open={adding}
        onOpenChange={setAdding}
        title="Agregar origen de contacto"
        description="Ingresá el nombre del nuevo origen."
        placeholder="Ej. Conferencia anual"
        saving={createMutation.isPending}
        onSave={(name) => createMutation.mutate(name)}
      />
      <NameDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Editar origen de contacto"
        description="Los contactos con este origen muestran el nombre nuevo."
        initial={editing?.name}
        saving={renameMutation.isPending}
        onSave={(name) =>
          editing && renameMutation.mutate({ id: editing.id, name })
        }
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-ink">
              {deletingCount > 0 ? "No se puede eliminar" : "¿Estás seguro?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-brand">
              {deletingCount > 0
                ? `${deletingCount} ${deletingCount === 1 ? "contacto tiene" : "contactos tienen"} el origen «${deleting?.name}». Cambiáselo antes de eliminarlo.`
                : `Se eliminará el origen «${deleting?.name}».`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-md border-brand-border">
              {deletingCount > 0 ? "Entendido" : "Cancelar"}
            </AlertDialogCancel>
            {deletingCount === 0 && (
              <AlertDialogAction
                className="rounded-md bg-red-500 text-white hover:bg-red-600"
                disabled={deleteMutation.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  if (deleting) deleteMutation.mutate(deleting.id);
                }}
              >
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
