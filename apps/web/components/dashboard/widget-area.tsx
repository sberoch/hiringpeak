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
  SortableContext,
  type SortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EyeOff, GripVertical, Plus } from "lucide-react";
import type { LayoutCatalogueEntry } from "@workspace/shared/lib/layout";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";

import type { SavedLayoutState } from "@/hooks/use-saved-layout";

import type { WidgetDefinition } from "./dashboard-widgets";
import { hideWidget, moveWidget, showWidget } from "./widget-area-edits";

interface WidgetAreaProps<E extends LayoutCatalogueEntry> {
  /** The Area's name in edit mode. */
  title: string;
  layout: SavedLayoutState<E>;
  definitions: Record<E["key"], WidgetDefinition>;
  editing: boolean;
  /** Lays out the Area's Widgets (a grid row, a column). */
  className: string;
  strategy: SortingStrategy;
}

/**
 * One dashboard Widget Area: its shown Widgets in order. In edit mode each
 * Widget gets a drag handle and a hide control, and the Area an "Agregar"
 * picker for its hidden Widgets. Each Area has its own drag context, so a
 * Widget can't be dropped in another Area.
 */
export function WidgetArea<E extends LayoutCatalogueEntry>({
  title,
  layout,
  definitions,
  editing,
  className,
  strategy,
}: WidgetAreaProps<E>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const definitionOf = (entry: E) => definitions[entry.key as E["key"]];

  // Until the saved layout is known, Widgets stay unmounted so a Widget
  // the User hid never loads its data.
  if (layout.isLoading) {
    return (
      <div className={className}>
        {layout.entries.map((entry) => (
          <Skeleton key={entry.key} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!editing) {
    if (layout.entries.length === 0) return null;
    return (
      <div className={className}>
        {layout.entries.map((entry) => {
          const { Component } = definitionOf(entry);
          return <Component key={entry.key} />;
        })}
      </div>
    );
  }

  const area = layout.choices.map(({ entry, visible }) => ({
    key: entry.key,
    visible,
  }));
  const hidden = layout.choices.filter((choice) => !choice.visible);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const moved = moveWidget(area, String(active.id), String(over.id));
    if (moved !== area) layout.rearrange(moved);
  };

  return (
    <section
      aria-label={title}
      className="flex min-w-0 flex-col gap-6 rounded-2xl border border-dashed border-electric/30 bg-electric/[0.02] p-3"
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-brand">
          {title}
        </h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={hidden.length === 0}
              className="h-7 gap-1.5 rounded-lg border-brand-border px-2.5 text-xs text-slate-brand hover:border-electric hover:text-ink"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {hidden.map(({ entry }) => (
              <DropdownMenuItem
                key={entry.key}
                onSelect={() => layout.rearrange(showWidget(area, entry.key))}
              >
                {definitionOf(entry).label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {layout.entries.length === 0 ? (
        <p className="px-1 pb-2 text-xs text-muted-brand">
          Sin widgets. Agregá uno desde «Agregar».
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={layout.entries.map((entry) => entry.key)}
            strategy={strategy}
          >
            <div className={className}>
              {layout.entries.map((entry) => (
                <SortableWidget
                  key={entry.key}
                  id={entry.key}
                  definition={definitionOf(entry)}
                  onHide={() => layout.rearrange(hideWidget(area, entry.key))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}

function SortableWidget({
  id,
  definition: { label, Component },
  onHide,
}: {
  id: string;
  definition: WidgetDefinition;
  onHide: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative min-w-0", isDragging && "z-20 opacity-80")}
    >
      <div className="absolute -top-3.5 right-4 z-10 flex items-center gap-1 rounded-lg border border-brand-border bg-surface p-0.5 shadow-sm">
        <button
          type="button"
          aria-label={`Mover ${label}`}
          className="flex h-7 w-7 cursor-grab items-center justify-center rounded-md text-muted-brand hover:bg-brand-border-light hover:text-ink active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={`Ocultar ${label}`}
          title="Ocultar"
          onClick={onHide}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-brand hover:bg-brand-border-light hover:text-ink"
        >
          <EyeOff className="h-4 w-4" />
        </button>
      </div>
      <Component />
    </div>
  );
}
