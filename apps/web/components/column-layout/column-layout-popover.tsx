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
import { Columns3, GripVertical, Lock, RotateCcw } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";

import type { ColumnMenu, ColumnMenuItem } from "./use-column-layout";

/**
 * The "Columnas" toolbar button: a checkbox and a drag handle per column,
 * locked columns pinned in place, and "Restablecer".
 */
export function ColumnLayoutPopover({ items, onChange, onReset }: ColumnMenu) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const first = items.filter((item) => item.lock === "first");
  const movable = items.filter((item) => !item.lock);
  const last = items.filter((item) => item.lock === "last");

  const toggle = (key: string) =>
    onChange(
      items.map((item) =>
        item.key === key ? { ...item, visible: !item.visible } : item,
      ),
    );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = movable.findIndex((item) => item.key === active.id);
    const to = movable.findIndex((item) => item.key === over.id);
    if (from < 0 || to < 0) return;
    onChange([...first, ...arrayMove(movable, from, to), ...last]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="rounded-xl border-brand-border text-slate-brand hover:text-ink hover:border-electric hover:bg-electric/5 transition-all gap-2"
        >
          <Columns3 className="h-4 w-4" />
          Columnas
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <div className="max-h-[60vh] overflow-y-auto p-1.5">
          {first.map((item) => (
            <LockedRow key={item.key} item={item} />
          ))}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={movable.map((item) => item.key)}
              strategy={verticalListSortingStrategy}
            >
              {movable.map((item) => (
                <SortableRow
                  key={item.key}
                  item={item}
                  onToggle={() => toggle(item.key)}
                />
              ))}
            </SortableContext>
          </DndContext>
          {last.map((item) => (
            <LockedRow key={item.key} item={item} />
          ))}
        </div>
        <div className="border-t border-brand-border p-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="w-full justify-start gap-2 text-slate-brand hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restablecer
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SortableRow({
  item,
  onToggle,
}: {
  item: ColumnMenuItem;
  onToggle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key });
  const id = `column-${item.key}`;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-brand-border-light/50",
        isDragging &&
          "relative z-10 bg-surface shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
      )}
    >
      <button
        type="button"
        aria-label={`Mover ${item.label}`}
        className="flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-brand hover:bg-brand-border-light hover:text-slate-brand active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <Checkbox id={id} checked={item.visible} onCheckedChange={onToggle} />
      <label
        htmlFor={id}
        className="flex-1 cursor-pointer truncate text-sm text-ink"
      >
        {item.label}
      </label>
    </div>
  );
}

function LockedRow({ item }: { item: ColumnMenuItem }) {
  return (
    <div
      className="flex items-center gap-2 px-1.5 py-1.5"
      title="Esta columna siempre se muestra"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-brand">
        <Lock className="h-3 w-3" />
      </span>
      <Checkbox checked disabled aria-label={item.label} />
      <span className="flex-1 truncate text-sm text-slate-brand">
        {item.label}
      </span>
    </div>
  );
}
