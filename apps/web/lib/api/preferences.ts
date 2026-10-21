import type {
  LayoutKey,
  SavedLayoutDto,
  SavedLayouts,
} from "@workspace/shared/dtos";

import api from ".";

/** Query key of every layout the current User saved (one cache entry). */
export const LAYOUTS_QUERY_KEY = ["preferences", "layouts"] as const;

export async function getLayouts() {
  const response = await api.get<SavedLayouts>("/preferences/layouts");
  return response.data;
}

export async function saveLayout(key: LayoutKey, layout: SavedLayoutDto) {
  const response = await api.put<SavedLayoutDto>(
    `/preferences/layouts/${key}`,
    layout,
  );
  return response.data;
}

/** Back to the catalogue default. */
export async function resetLayout(key: LayoutKey) {
  await api.delete(`/preferences/layouts/${key}`);
}
