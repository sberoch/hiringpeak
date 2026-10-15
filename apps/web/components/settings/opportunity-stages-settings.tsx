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
import {
  isOpenStage,
  sortOpportunityStages,
} from "@workspace/shared/lib/opportunity-stage";
import type {
  OpportunityStageOutcome,
  OpportunityStageWithUsage,
} from "@workspace/shared/types/opportunity";
import {
  apiErrorMessage,
  stageTone,
} from "@/components/opportunities/opportunity-ui";
import {
  createOpportunityStage,
  deleteOpportunityStage,
  getOpportunityStages,
  OPPORTUNITY_API_KEY,
  OPPORTUNITY_STAGE_API_KEY,
  setOpportunityStageOutcome,
  updateOpportunityStage,
} from "@/lib/api/opportunity";
import {
  NameDialog,
  NoResults,
  RowIconButton,
  SettingsToolbar,
  UsagePill,
  useListSensors,
} from "./commercial-settings-shared";

type Stage = OpportunityStageWithUsage;

const isOpen = (stage: Stage) => isOpenStage(stage);

function OutcomeRadio({
  checked,
  label,
  tone,
  onPick,
}: {
  checked: boolean;
  label: string;
  tone: OpportunityStageOutcome;
  onPick?: () => void;
}) {
  const color =
    tone === "won"
      ? {
          text: "text-emerald-700",
          border: "border-emerald-600",
          dot: "bg-emerald-600",
        }
      : {
          text: "text-slate-700",
          border: "border-slate-600",
          dot: "bg-slate-600",
        };
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      disabled={!onPick && !checked}
      onClick={() => !checked && onPick?.()}
      title={
        checked
          ? `Es la etapa ${label.toLowerCase()}`
          : `Usar como etapa ${label.toLowerCase()}`
      }
      className={cn(
        "flex w-[78px] items-center justify-center gap-1.5 rounded-md py-1 text-xs transition-colors disabled:cursor-default",
        checked
          ? color.text
          : "text-muted-brand enabled:hover:bg-brand-border-light enabled:hover:text-ink",
      )}
    >
      <span
        className={cn(
          "flex h-3.5 w-3.5 items-center justify-center rounded-full border",
          checked ? color.border : "border-brand-border",
        )}
      >
        {checked && (
          <span className={cn("h-1.5 w-1.5 rounded-full", color.dot)} />
        )}
      </span>
      {label}
    </button>
  );
}

function StageRow({
  stage,
  first,
  dragDisabled,
  canDelete,
  onEdit,
  onDelete,
  onOutcome,
}: {
  stage: Stage;
  first: boolean;
  dragDisabled: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onOutcome?: (outcome: OpportunityStageOutcome) => void;
}) {
  const pinned = !isOpen(stage);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id, disabled: pinned || dragDisabled });
  const tone = stageTone(stage);

  return (
    <li
      ref={pinned ? undefined : setNodeRef}
      style={
        pinned
          ? undefined
          : { transform: CSS.Transform.toString(transform), transition }
      }
      className={cn(
        "group flex items-center justify-between px-4 py-3 transition-colors duration-150 hover:bg-brand-border-light/50",
        !first && "border-t border-brand-border",
        pinned && "bg-canvas/60",
        isDragging &&
          "z-10 rounded-lg bg-surface shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {pinned ? (
          <span
            title="Ganada y perdida siempre van al final"
            className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-brand"
          >
            <Lock className="h-3.5 w-3.5" />
          </span>
        ) : (
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
        )}
        <span className={cn("h-2 w-2 shrink-0 rounded-full", tone.dot)} />
        <span className="truncate text-sm font-medium text-ink">
          {stage.name}
        </span>
        <UsagePill
          n={stage.opportunityCount}
          one="oportunidad"
          many="oportunidades"
        />
      </div>
      <div className="flex items-center gap-1">
        <div
          role="radiogroup"
          className="mr-2 flex items-center gap-0.5 border-r border-brand-border pr-2"
        >
          <OutcomeRadio
            checked={stage.isWon}
            label="Ganada"
            tone="won"
            onPick={onOutcome && (() => onOutcome("won"))}
          />
          <OutcomeRadio
            checked={stage.isLost}
            label="Perdida"
            tone="lost"
            onPick={onOutcome && (() => onOutcome("lost"))}
          />
        </div>
        <RowIconButton title="Editar" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </RowIconButton>
        <RowIconButton
          danger
          title={
            pinned
              ? "No se puede eliminar la etapa ganada ni la perdida"
              : canDelete
                ? "Eliminar"
                : "Tiene que quedar al menos una etapa abierta"
          }
          disabled={pinned || !canDelete}
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </RowIconButton>
      </div>
    </li>
  );
}

export default function OpportunityStagesSettings() {
  const queryClient = useQueryClient();
  const sensors = useListSensors();
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Stage | null>(null);
  const [deleting, setDeleting] = useState<Stage | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [OPPORTUNITY_STAGE_API_KEY],
    queryFn: getOpportunityStages,
  });

  const stages = useMemo(
    () => (data ? sortOpportunityStages(data) : []),
    [data],
  );
  const open = stages.filter(isOpen);
  const outcomes = stages.filter((stage) => !isOpen(stage));
  const term = search.trim().toLowerCase();
  const match = (stage: Stage) => stage.name.toLowerCase().includes(term);
  const openShown = open.filter(match);
  const outcomesShown = outcomes.filter(match);

  // Stage names and outcomes show on every Opportunity, so refresh those too.
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_STAGE_API_KEY] }),
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_API_KEY] }),
    ]);

  const createMutation = useMutation({
    mutationFn: (name: string) => createOpportunityStage({ name }),
    onSuccess: async () => {
      await invalidate();
      setAdding(false);
      toast.success("Etapa creada correctamente");
    },
    onError: (err) =>
      toast.error(apiErrorMessage(err, "Error al crear la etapa")),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      updateOpportunityStage(id, { name }),
    onSuccess: async () => {
      await invalidate();
      setEditing(null);
      toast.success("Etapa actualizada correctamente");
    },
    onError: (err) =>
      toast.error(apiErrorMessage(err, "Error al actualizar la etapa")),
  });

  const reorderMutation = useMutation({
    mutationFn: ({ id, sort }: { id: number; sort: number }) =>
      updateOpportunityStage(id, { sort }),
    onSettled: invalidate,
    onError: (err) =>
      toast.error(apiErrorMessage(err, "Error al actualizar el orden")),
  });

  const outcomeMutation = useMutation({
    mutationFn: ({
      stage,
      outcome,
    }: {
      stage: Stage;
      outcome: OpportunityStageOutcome;
    }) => setOpportunityStageOutcome(stage.id, outcome),
    onSuccess: async (_, { stage, outcome }) => {
      await invalidate();
      toast.success(
        `«${stage.name}» es ahora la etapa ${outcome === "won" ? "ganada" : "perdida"}`,
      );
    },
    onError: (err) =>
      setBlocked(apiErrorMessage(err, "No se pudo cambiar la etapa.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteOpportunityStage(id),
    onSuccess: async () => {
      await invalidate();
      toast.success("Etapa eliminada correctamente");
    },
    onError: (err) =>
      toast.error(apiErrorMessage(err, "Error al eliminar la etapa")),
    onSettled: () => setDeleting(null),
  });

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = open.findIndex((stage) => stage.id === active.id);
    const to = open.findIndex((stage) => stage.id === over.id);
    if (from < 0 || to < 0) return;
    const reordered = arrayMove(open, from, to).map((stage, sort) => ({
      ...stage,
      sort,
    }));
    queryClient.setQueryData<Stage[]>(
      [OPPORTUNITY_STAGE_API_KEY],
      [...reordered, ...outcomes],
    );
    reorderMutation.mutate({ id: Number(active.id), sort: to });
  };

  const deletingCount = deleting?.opportunityCount ?? 0;

  return (
    <div className="space-y-4">
      <SettingsToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar etapas..."
        onAdd={() => setAdding(true)}
      />
      {data && (
        <p className="text-xs text-muted-brand">
          {term
            ? "Borrá la búsqueda para reordenar"
            : "Arrastrá para reordenar las etapas abiertas. Ganada y Perdida quedan fijas al final."}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-brand-border">
        {!data && isLoading ? (
          <div className="space-y-2 p-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        ) : openShown.length + outcomesShown.length === 0 ? (
          <NoResults text="No se encontraron etapas con ese nombre." />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <ul>
              <SortableContext
                items={openShown.map((stage) => stage.id)}
                strategy={verticalListSortingStrategy}
              >
                {openShown.map((stage, i) => (
                  <StageRow
                    key={stage.id}
                    stage={stage}
                    first={i === 0}
                    dragDisabled={!!term}
                    canDelete={open.length > 1}
                    onEdit={() => setEditing(stage)}
                    onDelete={() => setDeleting(stage)}
                    onOutcome={(outcome) =>
                      outcomeMutation.mutate({ stage, outcome })
                    }
                  />
                ))}
              </SortableContext>
              {outcomesShown.length > 0 && (
                <li
                  className={cn(
                    "bg-canvas px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-brand",
                    openShown.length > 0 && "border-t border-brand-border",
                  )}
                >
                  Resultado · siempre al final
                </li>
              )}
              {outcomesShown.map((stage) => (
                <StageRow
                  key={stage.id}
                  stage={stage}
                  first={false}
                  dragDisabled
                  canDelete={false}
                  onEdit={() => setEditing(stage)}
                  onDelete={() => undefined}
                />
              ))}
            </ul>
          </DndContext>
        )}
      </div>

      <NameDialog
        open={adding}
        onOpenChange={setAdding}
        title="Agregar Etapa de Oportunidad"
        description="Se agrega como la última etapa abierta (antes de Ganada y Perdida)."
        placeholder="Ej. Due diligence"
        saving={createMutation.isPending}
        onSave={(name) => createMutation.mutate(name)}
      />
      <NameDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Editar Etapa de Oportunidad"
        description="Modificá el nombre de la etapa. Las oportunidades que están en ella no cambian."
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
                ? `Hay ${deletingCount} ${deletingCount === 1 ? "oportunidad" : "oportunidades"} en «${deleting?.name}». Movelas a otra etapa antes de eliminarla.`
                : `Se eliminará la etapa «${deleting?.name}». No hay oportunidades en ella.`}
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

      <AlertDialog
        open={!!blocked}
        onOpenChange={(o) => !o && setBlocked(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-ink">
              No se puede cambiar
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-brand">
              {blocked}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-md border-brand-border">
              Entendido
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
