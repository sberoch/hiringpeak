"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  LayoutKey,
  SavedLayoutDto,
  SavedLayouts,
} from "@workspace/shared/dtos";
import {
  canSeeWith,
  type LayoutCatalogueEntry,
  type LayoutChoice,
  layoutChoices,
  rearrangeLayout,
  resolveLayout,
  type SavedLayout,
} from "@workspace/shared/lib/layout";

import { usePermissions } from "@/contexts/permission-context";
import {
  getLayouts,
  LAYOUTS_QUERY_KEY,
  resetLayout,
  saveLayout,
} from "@/lib/api/preferences";

export interface SavedLayoutState<E extends LayoutCatalogueEntry> {
  /** The entries to show, in order. */
  entries: E[];
  /** Every entry the User may see, in order, hidden ones included. */
  choices: LayoutChoice<E>[];
  /** Saves the User's new arrangement of the entries they can see. */
  rearrange: (choices: SavedLayout) => void;
  /** Back to the catalogue default. */
  reset: () => void;
  /** True until the saved layouts arrive (the default shows meanwhile). */
  isLoading: boolean;
}

/**
 * A User's layout for one layout key (a list screen or a dashboard Widget
 * Area), resolved against its catalogue and the User's Permissions.
 * Changes apply instantly, save in the background and roll back with a
 * toast if the save fails.
 */
export function useSavedLayout<E extends LayoutCatalogueEntry>(
  layoutKey: LayoutKey,
  catalogue: readonly E[],
): SavedLayoutState<E> {
  const queryClient = useQueryClient();
  const { permissionCodes, isLoading: permissionsLoading } = usePermissions();
  const codesKey = permissionCodes.join(",");
  const canSee = useMemo(
    () => canSeeWith(codesKey ? codesKey.split(",") : []),
    [codesKey],
  );

  const { data, isLoading } = useQuery({
    queryKey: LAYOUTS_QUERY_KEY,
    queryFn: getLayouts,
    staleTime: Infinity,
  });
  const saved = data?.[layoutKey];

  const { mutate } = useMutation({
    // Saves of one layout run in order, so the last change wins.
    scope: { id: `layout:${layoutKey}` },
    mutationFn: async (next: SavedLayoutDto | null) => {
      if (next) await saveLayout(layoutKey, next);
      else await resetLayout(layoutKey);
    },
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: LAYOUTS_QUERY_KEY });
      const previous =
        queryClient.getQueryData<SavedLayouts>(LAYOUTS_QUERY_KEY);
      queryClient.setQueryData<SavedLayouts>(LAYOUTS_QUERY_KEY, (old) => {
        const layouts = { ...old };
        if (next) layouts[layoutKey] = next;
        else delete layouts[layoutKey];
        return layouts;
      });
      return { previous };
    },
    onError: (_error, _next, context) => {
      if (context?.previous) {
        queryClient.setQueryData(LAYOUTS_QUERY_KEY, context.previous);
      } else {
        queryClient.invalidateQueries({ queryKey: LAYOUTS_QUERY_KEY });
      }
      toast.error(
        "No se pudo guardar el cambio. Se restauró la vista anterior.",
      );
    },
  });

  const rearrange = useCallback(
    (choices: SavedLayout) =>
      mutate(rearrangeLayout(catalogue, saved, canSee, choices)),
    [mutate, catalogue, saved, canSee],
  );
  const reset = useCallback(() => mutate(null), [mutate]);

  return useMemo(
    () => ({
      entries: resolveLayout(catalogue, saved, canSee),
      choices: layoutChoices(catalogue, saved, canSee),
      rearrange,
      reset,
      isLoading: isLoading || permissionsLoading,
    }),
    [catalogue, saved, canSee, rearrange, reset, isLoading, permissionsLoading],
  );
}
