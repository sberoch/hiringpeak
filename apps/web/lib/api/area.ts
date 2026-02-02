import { PaginatedResponse } from "@workspace/shared/types/api";
import {
  Area,
  AreaParams,
  CreateAreaDto,
  UpdateAreaDto,
} from "@workspace/shared/types/area";

import api from ".";
import { filtersToSearchParams } from "../utils";

export const AREAS_API_KEY = "area";

export async function getAllAreas(params: AreaParams) {
  const searchParams = filtersToSearchParams(params);
  const response = await api.get<PaginatedResponse<Area>>(
    `/area${searchParams}`
  );
  return response.data;
}

export async function createArea(area: CreateAreaDto) {
  const response = await api.post<Area>("/area", area);
  return response.data;
}

export async function updateArea(id: Area["id"], area: UpdateAreaDto) {
  const response = await api.patch<Area>(`/area/${id}`, area);
  return response.data;
}

export async function deleteArea(id: Area["id"]) {
  const response = await api.delete(`/area/${id}`);
  return response.data;
}
