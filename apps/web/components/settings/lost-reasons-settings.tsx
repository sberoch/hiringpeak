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
import { GripVertical, Lock, Pencil, Trash2 } from "lucide-react";
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
import type { LostReasonWithUsage } from "@workspace/shared/types/opportunity";
import { apiErrorMessage } from "@/components/opportunities/opportunity-ui";
import {
  createLostReason,
  deleteLostReason,
  getLostReasons,
  LOST_REASON_API_KEY,
  OPPORTUNITY_API_KEY,
  updateLostReason,
} from "@/lib/api/opportunity";
import {
  NameDialog,
  NoResults,
  RowIconButton,
  SettingsToolbar,
  UsagePill,
  useListSensors,
} from "./commercial-settings-shared";

type Reason = LostReasonWithUsage;

function ReasonRow({
  reason,
  first,
  dragDisabled,
  isOnly,
  onEdit,
  onDelete,
}: {
  reason: Reason;
  first: boolean;
  dragDisabled: boolean;
  isOnly: boolean;
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
  } = useSortable({ id: reason.id, disabled: dragDisabled });

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
          {reason.name}
        </span>
        <UsagePill n={reason.opportunityCount} one="perdida" many="perdidas" />
      </div>
      <div className="flex items-center gap-1">
        <RowIconButton title="Editar" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </RowIconButton>
        <RowIconButton
          danger
          title={isOnly ? "Tiene que quedar al menos un motivo" : "Eliminar"}
          disabled={isOnly}
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </RowIconButton>
      </div>
    </li>
  );
}

export default function LostReasonsSettings() {
  const queryClient = useQueryClient();
  const sensors = useListSensors();
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Reason | null>(null);
  const [deleting, setDeleting] = useState<Reason | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [LOST_REASON_API_KEY],
    queryFn: getLostReasons,
  });

  const reasons = useMemo(() => data ?? [], [data]);
  const term = search.trim().toLowerCase();
  const shown = reasons.filter((reason) =>
    reason.name.toLowerCase().includes(term),
  );

  // Lost Reason names show on lost Opportunities, so refresh those too.
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [LOST_REASON_API_KEY] }),
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_API_KEY] }),
    ]);

  const createMutation = useMutation({
    mutationFn: (name: string) => createLostReason({ name }),
    onSuccess: async () => {
      await invalidate();
      setAdding(false);
      toast.success("Motivo de pérdida creado correctamente");
    },
    onError: (err) =>
      toast.error(apiErrorMessage(err, "Error al crear el motivo de pérdida")),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      updateLostReason(id, { name }),
    onSuccess: async () => {
      await invalidate();
      setEditing(null);
      toast.success("Motivo de pérdida actualizado correctamente");
    },
    onError: (err) =>
      toast.error(
        apiErrorMessage(err, "Error al actualizar el motivo de pérdida"),
      ),
  });

  const reorderMutation = useMutation({
    mutationFn: ({ id, sort }: { id: number; sort: number }) =>
      updateLostReason(id, { sort }),
    onSettled: invalidate,
    onError: (err) =>
      toast.error(apiErrorMessage(err, "Error al actualizar el orden")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteLostReason(id),
    onSuccess: async () => {
      await invalidate();
      toast.success("Motivo de pérdida eliminado correctamente");
    },
    onError: (err) =>
      toast.error(
        apiErrorMessage(err, "Error al eliminar el motivo de pérdida"),
      ),
    onSettled: () => setDeleting(null),
  });

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = reasons.findIndex((reason) => reason.id === active.id);
    const to = reasons.findIndex((reason) => reason.id === over.id);
    if (from < 0 || to < 0) return;
    queryClient.setQueryData<Reason[]>(
      [LOST_REASON_API_KEY],
      arrayMove(reasons, from, to).map((reason, sort) => ({ ...reason, sort })),
    );
    reorderMutation.mutate({ id: Number(active.id), sort: to });
  };

  const deletingCount = deleting?.opportunityCount ?? 0;

  return (
    <div className="space-y-4">
      <SettingsToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar motivos de pérdida..."
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
          <NoResults text="No se encontraron motivos con ese nombre." />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <ul>
              <SortableContext
                items={shown.map((reason) => reason.id)}
                strategy={verticalListSortingStrategy}
              >
                {shown.map((reason, i) => (
                  <ReasonRow
                    key={reason.id}
                    reason={reason}
                    first={i === 0}
                    dragDisabled={!!term}
                    isOnly={reasons.length <= 1}
                    onEdit={() => setEditing(reason)}
                    onDelete={() => setDeleting(reason)}
                  />
                ))}
              </SortableContext>
            </ul>
          </DndContext>
        )}
      </div>
      {data && reasons.length <= 1 && (
        <p className="flex items-center gap-1.5 text-xs text-amber-700">
          <Lock className="h-3 w-3" /> Es el único motivo: no se puede eliminar.
          Agregá otro primero.
        </p>
      )}

      <NameDialog
        open={adding}
        onOpenChange={setAdding}
        title="Agregar Motivo de Pérdida"
        description="Ingresá el nombre del nuevo motivo."
        placeholder="Ej. Contrataron internamente"
        saving={createMutation.isPending}
        onSave={(name) => createMutation.mutate(name)}
      />
      <NameDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Editar Motivo de Pérdida"
        description="Las oportunidades perdidas con este motivo muestran el nombre nuevo."
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
                ? `${deletingCount} ${deletingCount === 1 ? "oportunidad perdida usa" : "oportunidades perdidas usan"} «${deleting?.name}». Reasignalas antes de eliminarlo.`
                : `Se eliminará el motivo «${deleting?.name}».`}
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
