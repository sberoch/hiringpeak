import { PaginatedResponse } from "@workspace/shared/types/api";
import {
  CreateSeniorityDto,
  Seniority,
  SeniorityParams,
  UpdateSeniorityDto,
} from "@workspace/shared/types/seniority";

import api from ".";
import { filtersToSearchParams } from "../utils";

export const SENIORITY_API_KEY = "seniority";

export async function getAllSeniorities(params: SeniorityParams) {
  const searchParams = filtersToSearchParams(params);
  const response = await api.get<PaginatedResponse<Seniority>>(
    `/seniority${searchParams}`
  );
  return response.data;
}

export async function createSeniority(seniority: CreateSeniorityDto) {
  const response = await api.post<Seniority>("/seniority", seniority);
  return response.data;
}

export async function updateSeniority(
  id: Seniority["id"],
  seniority: UpdateSeniorityDto
) {
  const response = await api.patch<Seniority>(`/seniority/${id}`, seniority);
  return response.data;
}

export async function deleteSeniority(id: Seniority["id"]) {
  const response = await api.delete(`/seniority/${id}`);
  return response.data;
}
