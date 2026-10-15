"use client";

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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation } from "@tanstack/react-query";
import { GripVertical, Lock, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { apiErrorMessage } from "@/components/opportunities/opportunity-ui";
import { usePermissions } from "@/contexts/permission-context";
import { PermissionCode } from "@workspace/shared/enums";
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
import { LoadingSpinner } from "@workspace/ui/components/loading-spinner";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";

/** Settings «Comercial» screens: rendered only for users with CRM_MANAGE. */
export function CrmManageOnly({ children }: { children: ReactNode }) {
  const { hasPermission, isLoading } = usePermissions();
  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }
  if (hasPermission(PermissionCode.CRM_MANAGE)) return <>{children}</>;
  return (
    <div className="rounded-2xl border border-brand-border bg-surface p-8 text-center">
      <Lock className="mx-auto h-6 w-6 text-muted-brand" />
      <p className="mt-3 text-lg font-bold text-ink">Sin acceso</p>
      <p className="mt-1 text-sm text-slate-brand">
        Solo quien administra el área comercial puede configurar esta sección.
      </p>
    </div>
  );
}

/** Card + heading every settings page wraps its content in. */
export function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-brand-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mb-6">
        <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
        <p className="mt-0.5 text-sm leading-relaxed text-slate-brand">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}

export function SettingsToolbar({
  search,
  onSearch,
  placeholder,
  onAdd,
}: {
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-brand" />
        <input
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full rounded-xl border border-brand-border bg-canvas py-2.5 pl-9 pr-4 text-sm text-ink outline-none transition-all duration-200 placeholder:text-muted-brand focus:border-electric focus:shadow-[0_0_0_4px_rgba(0,102,255,0.08)]"
        />
      </div>
      <button
        onClick={onAdd}
        className="inline-flex shrink-0 items-center gap-2 rounded-md bg-electric px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-electric-light hover:shadow-[0_12px_32px_-8px_rgba(0,102,255,0.4)]"
      >
        <Plus className="h-4 w-4" />
        Agregar
      </button>
    </div>
  );
}

export function NoResults({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-border-light">
        <Search className="h-5 w-5 text-muted-brand" />
      </div>
      <p className="text-sm font-medium text-ink">Sin resultados</p>
      <p className="mt-0.5 text-xs text-muted-brand">{text}</p>
    </div>
  );
}

export function RowIconButton({
  onClick,
  danger,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-lg text-slate-brand transition-colors disabled:cursor-not-allowed disabled:opacity-35",
        danger
          ? "enabled:hover:bg-red-50 enabled:hover:text-red-500"
          : "hover:bg-electric/10 hover:text-electric",
      )}
    >
      {children}
      <span className="sr-only">{title}</span>
    </button>
  );
}

/** "3 oportunidades" pill; muted when zero. */
export function UsagePill({
  n,
  one,
  many,
}: {
  n: number;
  one: string;
  many: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
        n > 0
          ? "bg-electric/[0.07] text-electric"
          : "bg-brand-border-light text-muted-brand",
      )}
    >
      {n} {n === 1 ? one : many}
    </span>
  );
}

export function useListSensors() {
  return useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
}

/** Add / rename dialog with a single "Nombre" field. */
export function NameDialog({
  open,
  onOpenChange,
  title,
  description,
  initial = "",
  placeholder,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  initial?: string;
  placeholder?: string;
  saving?: boolean;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(initial);
  useEffect(() => {
    if (open) setName(initial);
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-ink">{title}</DialogTitle>
          <DialogDescription className="text-slate-brand">
            {description}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onSave(name.trim());
          }}
        >
          <div className="py-4">
            <Label
              htmlFor="settings-name"
              className="text-sm font-semibold text-ink"
            >
              Nombre
            </Label>
            <Input
              id="settings-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={placeholder}
              className="mt-2 rounded-xl border-brand-border bg-canvas focus:border-electric focus:ring-electric/10"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-md border-brand-border text-ink hover:bg-brand-border-light"
            >
              Cancelar
            </Button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="inline-flex items-center justify-center rounded-md bg-electric px-4 py-2 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-electric-light hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.4)] disabled:pointer-events-none disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type CatalogItem = { id: number; name: string; sort: number };

/** Copy for one ordered catalog screen ("Orígenes", "Motivos de pérdida"). */
export type CatalogCopy = {
  searchPlaceholder: string;
  noMatch: string;
  empty: string;
  created: string;
  updated: string;
  deleted: string;
  createError: string;
  updateError: string;
  deleteError: string;
  addTitle: string;
  addDescription: string;
  addPlaceholder: string;
  editTitle: string;
  editDescription: string;
  /** Usage pill: "1 contacto" / "3 contactos". */
  usage: { one: string; many: string };
  /** Why an item in use can't be deleted. */
  inUse: (count: number, name: string) => string;
  confirmDelete: (name: string) => string;
  /** When set, the last item can't be deleted (with these explanations). */
  keepOne?: { rowTitle: string; note: string };
};

/** What the screen does with the catalog's API. */
export type CatalogActions<T extends CatalogItem> = {
  create: (name: string, sort: number) => Promise<unknown>;
  rename: (id: number, name: string) => Promise<unknown>;
  move: (id: number, sort: number) => Promise<unknown>;
  remove: (id: number) => Promise<unknown>;
  /** Refetches the catalog and whatever shows its names. */
  invalidate: () => Promise<unknown>;
  /** Optimistically shows the new order while a move is saved. */
  showOrder: (ordered: T[]) => void;
  usageOf: (item: T) => number;
};

function CatalogRow<T extends CatalogItem>({
  item,
  first,
  dragDisabled,
  usage,
  usageLabel,
  deleteBlockedTitle,
  onEdit,
  onDelete,
}: {
  item: T;
  first: boolean;
  dragDisabled: boolean;
  usage: number;
  usageLabel: { one: string; many: string };
  deleteBlockedTitle: string | null;
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
  } = useSortable({ id: item.id, disabled: dragDisabled });

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
          {item.name}
        </span>
        <UsagePill n={usage} one={usageLabel.one} many={usageLabel.many} />
      </div>
      <div className="flex items-center gap-1">
        <RowIconButton title="Editar" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </RowIconButton>
        <RowIconButton
          danger
          title={deleteBlockedTitle ?? "Eliminar"}
          disabled={deleteBlockedTitle != null}
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </RowIconButton>
      </div>
    </li>
  );
}

/**
 * An ordered catalog screen: search, drag to reorder, add, rename and delete
 * (blocked while in use). Contact Sources and Lost Reasons use it.
 */
export function SortableCatalogSettings<T extends CatalogItem>({
  items: loaded,
  isLoading,
  actions,
  copy,
}: {
  items: T[] | undefined;
  isLoading: boolean;
  actions: CatalogActions<T>;
  copy: CatalogCopy;
}) {
  const sensors = useListSensors();
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);

  const items = useMemo(() => loaded ?? [], [loaded]);
  const term = search.trim().toLowerCase();
  const shown = items.filter((item) => item.name.toLowerCase().includes(term));
  const isOnly = !!copy.keepOne && items.length <= 1;

  const createMutation = useMutation({
    mutationFn: (name: string) => actions.create(name, items.length),
    onSuccess: async () => {
      await actions.invalidate();
      setAdding(false);
      toast.success(copy.created);
    },
    onError: (err) => toast.error(apiErrorMessage(err, copy.createError)),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      actions.rename(id, name),
    onSuccess: async () => {
      await actions.invalidate();
      setEditing(null);
      toast.success(copy.updated);
    },
    onError: (err) => toast.error(apiErrorMessage(err, copy.updateError)),
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, sort }: { id: number; sort: number }) =>
      actions.move(id, sort),
    onSettled: actions.invalidate,
    onError: (err) =>
      toast.error(apiErrorMessage(err, "Error al actualizar el orden")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => actions.remove(id),
    onSuccess: async () => {
      await actions.invalidate();
      toast.success(copy.deleted);
    },
    onError: (err) => toast.error(apiErrorMessage(err, copy.deleteError)),
    onSettled: () => setDeleting(null),
  });

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((item) => item.id === active.id);
    const to = items.findIndex((item) => item.id === over.id);
    if (from < 0 || to < 0) return;
    actions.showOrder(
      arrayMove(items, from, to).map((item, sort) => ({ ...item, sort })),
    );
    moveMutation.mutate({ id: Number(active.id), sort: to });
  };

  const deletingCount = deleting ? actions.usageOf(deleting) : 0;

  return (
    <div className="space-y-4">
      <SettingsToolbar
        search={search}
        onSearch={setSearch}
        placeholder={copy.searchPlaceholder}
        onAdd={() => setAdding(true)}
      />
      {loaded && (
        <p className="text-xs text-muted-brand">
          {term
            ? "Borrá la búsqueda para reordenar"
            : "Arrastrá para reordenar"}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-brand-border">
        {!loaded && isLoading ? (
          <div className="space-y-2 p-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <NoResults text={term ? copy.noMatch : copy.empty} />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <ul>
              <SortableContext
                items={shown.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {shown.map((item, i) => (
                  <CatalogRow
                    key={item.id}
                    item={item}
                    first={i === 0}
                    dragDisabled={!!term}
                    usage={actions.usageOf(item)}
                    usageLabel={copy.usage}
                    deleteBlockedTitle={
                      isOnly ? (copy.keepOne?.rowTitle ?? null) : null
                    }
                    onEdit={() => setEditing(item)}
                    onDelete={() => setDeleting(item)}
                  />
                ))}
              </SortableContext>
            </ul>
          </DndContext>
        )}
      </div>
      {loaded && isOnly && (
        <p className="flex items-center gap-1.5 text-xs text-amber-700">
          <Lock className="h-3 w-3" /> {copy.keepOne?.note}
        </p>
      )}

      <NameDialog
        open={adding}
        onOpenChange={setAdding}
        title={copy.addTitle}
        description={copy.addDescription}
        placeholder={copy.addPlaceholder}
        saving={createMutation.isPending}
        onSave={(name) => createMutation.mutate(name)}
      />
      <NameDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={copy.editTitle}
        description={copy.editDescription}
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
              {deleting &&
                (deletingCount > 0
                  ? copy.inUse(deletingCount, deleting.name)
                  : copy.confirmDelete(deleting.name))}
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
