import { eq } from 'drizzle-orm';
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';
import type { DrizzleDatabase } from '../database/types/drizzle';

/**
 * Ordered per-Organization catalogs (Contact Sources, Lost Reasons,
 * Opportunity Stages): positions are `sort` 0..n-1, renumbered after every
 * add, move or delete. The planning functions are pure; `persistPositions`
 * writes only the rows whose position changed.
 */
export type Positioned = { id: number; sort: number };

/** Catalog order: by sort, then by id. */
export const byPosition = (a: Positioned, b: Positioned) =>
  a.sort - b.sort || a.id - b.id;

/** The items in the given order, with sort 0..n-1. */
export function renumber<T extends Positioned>(ordered: readonly T[]): T[] {
  return ordered.map((item, sort) => ({ ...item, sort }));
}

/**
 * Item `id` moved to `index` (clamped; default last) among `items`, the rest
 * keeping their order; renumbered. Returns the items unchanged when `id` is
 * not among them.
 */
export function moveTo<T extends Positioned>(
  items: readonly T[],
  id: number,
  index?: number,
): T[] {
  const ordered = [...items].sort(byPosition);
  const moved = ordered.find((item) => item.id === id);
  if (!moved) return renumber(ordered);
  const rest = ordered.filter((item) => item.id !== id);
  const at = Math.max(0, Math.min(index ?? rest.length, rest.length));
  rest.splice(at, 0, moved);
  return renumber(rest);
}

/** The items without `id`, renumbered. */
export function without<T extends Positioned>(
  items: readonly T[],
  id: number,
): T[] {
  return renumber([...items].sort(byPosition).filter((item) => item.id !== id));
}

/** Writes `sort` for every item whose position differs from `before`. */
export async function persistPositions(
  tx: Pick<DrizzleDatabase, 'update'>,
  table: PgTable & { id: AnyPgColumn; sort: AnyPgColumn },
  before: readonly Positioned[],
  after: readonly Positioned[],
): Promise<void> {
  for (const item of after) {
    const old = before.find((b) => b.id === item.id);
    if (old?.sort === item.sort) continue;
    await tx
      .update(table)
      .set({ sort: item.sort } as never)
      .where(eq(table.id, item.id));
  }
}
