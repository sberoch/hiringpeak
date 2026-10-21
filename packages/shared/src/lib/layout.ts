import type { PermissionCode } from "../enums";

/**
 * Layout resolution, shared by Column Layouts (one catalogue per list
 * screen) and Dashboard Layouts (one catalogue per Widget Area).
 *
 * A catalogue is defined in code; a saved layout is a User's stored
 * preference (absent until they change something). Layouts are
 * preferences, never permissions: `canSee` only skips entries the API
 * would not serve anyway.
 */

/** One entry of a Column Catalogue or a Widget Area catalogue. */
export interface LayoutCatalogueEntry<K extends string = string> {
  /** Stable key, stored in saved layouts. Never rename one. */
  key: K;
  shownByDefault: boolean;
  /** Locked entries are always shown and pinned to this end. */
  lock?: "first" | "last";
  /** The User needs any one of these codes to see the entry. */
  requires?: readonly PermissionCode[];
}

/** One entry of a saved layout, as stored per User and layout key. */
export interface SavedLayoutEntry {
  key: string;
  visible: boolean;
}

/** The full ordered list of keys with a visible flag each. */
export type SavedLayout = readonly SavedLayoutEntry[];

/** A catalogue entry as offered to the User, with its current visibility. */
export interface LayoutChoice<E extends LayoutCatalogueEntry> {
  entry: E;
  visible: boolean;
}

/**
 * The usual visibility predicate: the entry requires nothing, or the
 * User holds one of the codes it requires.
 */
export function canSeeWith(codes: readonly string[]) {
  return (entry: LayoutCatalogueEntry): boolean =>
    !entry.requires || entry.requires.some((code) => codes.includes(code));
}

/**
 * The entries to show, in order.
 *
 * - No saved layout: the shown-by-default entries in catalogue order.
 * - Saved entries keep their order and visibility; stale keys are ignored.
 * - Catalogue entries the saved layout doesn't mention are appended in
 *   catalogue order, shown only if shown by default.
 * - Locked entries are always shown, at their end.
 * - Entries failing `canSee` are dropped.
 */
export function resolveLayout<E extends LayoutCatalogueEntry>(
  catalogue: readonly E[],
  saved: SavedLayout | null | undefined,
  canSee: (entry: E) => boolean,
): E[] {
  return layoutChoices(catalogue, saved, canSee)
    .filter((choice) => choice.visible)
    .map((choice) => choice.entry);
}

/**
 * Every entry the User may see, in order, hidden ones included: what a
 * layout editor (the "Columnas" popover, dashboard edit mode) lists.
 * Same rules as `resolveLayout`.
 */
export function layoutChoices<E extends LayoutCatalogueEntry>(
  catalogue: readonly E[],
  saved: SavedLayout | null | undefined,
  canSee: (entry: E) => boolean,
): LayoutChoice<E>[] {
  return arrange(catalogue, saved).filter((choice) => canSee(choice.entry));
}

/**
 * The full layout to save after the User rearranged the entries they can
 * see (`choices`, in their new order). Entries the User may not see keep
 * their place and visibility, so they come back where they were if access
 * returns. Seen entries missing from `choices` keep their visibility and
 * follow the chosen ones; locks still win at resolution time.
 */
export function rearrangeLayout<E extends LayoutCatalogueEntry>(
  catalogue: readonly E[],
  saved: SavedLayout | null | undefined,
  canSee: (entry: E) => boolean,
  choices: SavedLayout,
): SavedLayoutEntry[] {
  const current = arrange(catalogue, saved);
  const seen = current.filter((choice) => canSee(choice.entry));
  const seenKeys = new Set(seen.map((choice) => choice.entry.key));
  const chosen = firstOfEachKey(
    choices.filter((choice) => seenKeys.has(choice.key)),
  );
  const chosenKeys = new Set(chosen.map((choice) => choice.key));
  const queue = [
    ...chosen,
    ...seen.filter((choice) => !chosenKeys.has(choice.entry.key)).map(toSaved),
  ];
  return current.map((choice) =>
    canSee(choice.entry) ? queue.shift()! : toSaved(choice),
  );
}

/** Every catalogue entry, ordered, with its visibility; locks applied. */
function arrange<E extends LayoutCatalogueEntry>(
  catalogue: readonly E[],
  saved: SavedLayout | null | undefined,
): LayoutChoice<E>[] {
  const byKey = new Map(catalogue.map((entry) => [entry.key, entry]));
  const middle: LayoutChoice<E>[] = [];
  const placed = new Set<string>();
  for (const item of firstOfEachKey(saved ?? [])) {
    const entry = byKey.get(item.key);
    if (!entry || entry.lock) continue;
    middle.push({ entry, visible: item.visible });
    placed.add(entry.key);
  }
  for (const entry of catalogue) {
    if (entry.lock || placed.has(entry.key)) continue;
    middle.push({ entry, visible: entry.shownByDefault });
  }
  const locked = (lock: "first" | "last") =>
    catalogue
      .filter((entry) => entry.lock === lock)
      .map((entry) => ({ entry, visible: true }));
  return [...locked("first"), ...middle, ...locked("last")];
}

function toSaved<E extends LayoutCatalogueEntry>(
  choice: LayoutChoice<E>,
): SavedLayoutEntry {
  return { key: choice.entry.key, visible: choice.visible };
}

function firstOfEachKey(entries: SavedLayout): SavedLayoutEntry[] {
  const keys = new Set<string>();
  return entries.filter((entry) => {
    if (keys.has(entry.key)) return false;
    keys.add(entry.key);
    return true;
  });
}
