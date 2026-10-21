import type { SavedLayout } from "@workspace/shared/lib/layout";

/**
 * The edits a User makes to one Widget Area in dashboard edit mode. Each
 * takes the Area's Widgets as offered (every Widget the User may see, in
 * order, hidden ones included) and returns the new arrangement to save.
 */

/** The hide control: the Widget keeps its place, hidden. */
export function hideWidget(area: SavedLayout, key: string): SavedLayout {
  return area.map((item) =>
    item.key === key ? { ...item, visible: false } : item,
  );
}

/** The "Agregar" picker: the Widget shows after the ones already shown. */
export function showWidget(area: SavedLayout, key: string): SavedLayout {
  const widget = area.find((item) => item.key === key);
  if (!widget) return area;
  const rest = area.filter((item) => item.key !== key);
  const lastShown = rest.findLastIndex((item) => item.visible);
  return [
    ...rest.slice(0, lastShown + 1),
    { ...widget, visible: true },
    ...rest.slice(lastShown + 1),
  ];
}

/**
 * The drag handle: the Widget takes the place of the one it was dropped
 * on. A drop outside the Area (or on itself) changes nothing, so Widgets
 * never change Area.
 */
export function moveWidget(
  area: SavedLayout,
  key: string,
  overKey: string,
): SavedLayout {
  const from = area.findIndex((item) => item.key === key);
  const to = area.findIndex((item) => item.key === overKey);
  if (from < 0 || to < 0 || from === to) return area;
  const moved = [...area];
  const [widget] = moved.splice(from, 1);
  moved.splice(to, 0, widget!);
  return moved;
}
