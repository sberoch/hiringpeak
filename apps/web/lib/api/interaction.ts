import type {
  CreateInteractionPayload,
  Interaction,
  InteractionFilters,
} from "@workspace/shared/types/interaction";

import api from ".";
import { filtersToSearchParams } from "../utils";

export const INTERACTION_API_KEY = "interaction";

/** Interactions of a Company (at the time), a Contact or an Opportunity; newest first. */
export async function getInteractions(filters: InteractionFilters) {
  const response = await api.get<Interaction[]>(
    `/interaction${filtersToSearchParams(filters)}`,
  );
  return response.data;
}

export async function createInteraction(payload: CreateInteractionPayload) {
  const response = await api.post<Interaction>("/interaction", payload);
  return response.data;
}

export async function deleteInteraction(id: number) {
  const response = await api.delete<Interaction>(`/interaction/${id}`);
  return response.data;
}
