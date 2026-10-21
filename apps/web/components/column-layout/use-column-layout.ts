"use client";

import { useMemo } from "react";
import type { LayoutKey } from "@workspace/shared/dtos";
import type { LayoutCatalogueEntry } from "@workspace/shared/lib/layout";

import { useSavedLayout } from "@/hooks/use-saved-layout";

/** How a screen draws one catalogue column: its popover label and column. */
export interface ColumnDefinition<C> {
  label: string;
  column: C;
}

/** One row of the "Columnas" popover. */
export interface ColumnMenuItem {
  key: string;
  label: string;
  visible: boolean;
  /** Locked columns are always shown and pinned to this end. */
  lock?: "first" | "last";
}

/** What the "Columnas" popover needs. */
export interface ColumnMenu {
  items: ColumnMenuItem[];
  onChange: (items: ColumnMenuItem[]) => void;
  onReset: () => void;
}

/**
 * Column Layout for one list screen. Works with any table: `C` is whatever
 * the table renders a column from (a tanstack `ColumnDef` for the shared
 * DataTable, a custom column object for a custom table).
 *
 * Returns the columns to render, in order, and the "Columnas" popover's
 * props.
 */
export function useColumnLayout<E extends LayoutCatalogueEntry, C>(
  layoutKey: LayoutKey,
  catalogue: readonly E[],
  definitions: Record<E["key"], ColumnDefinition<C>>,
): { columns: C[]; menu: ColumnMenu } {
  const layout = useSavedLayout(layoutKey, catalogue);
  const { entries, choices, rearrange, reset } = layout;

  const columns = useMemo(
    () => entries.map((entry) => definitions[entry.key as E["key"]].column),
    [entries, definitions],
  );

  const menu = useMemo<ColumnMenu>(
    () => ({
      items: choices.map(({ entry, visible }) => ({
        key: entry.key,
        label: definitions[entry.key as E["key"]].label,
        visible,
        lock: entry.lock,
      })),
      onChange: (items) =>
        rearrange(items.map(({ key, visible }) => ({ key, visible }))),
      onReset: reset,
    }),
    [choices, definitions, rearrange, reset],
  );

  return { columns, menu };
}
