import { PaginatedResponse } from "@workspace/shared/types/api";
import {
  Industry,
  IndustryParams,
  CreateIndustryDto,
  UpdateIndustryDto,
} from "@workspace/shared/types/industry";

import api from ".";
import { filtersToSearchParams } from "../utils";

export const INDUSTRIES_API_KEY = "industry";

export async function getAllIndustries(params: IndustryParams) {
  const searchParams = filtersToSearchParams(params);
  const response = await api.get<PaginatedResponse<Industry>>(
    `/industry${searchParams}`
  );
  return response.data;
}

export async function createIndustry(industry: CreateIndustryDto) {
  const response = await api.post<Industry>("/industry", industry);
  return response.data;
}

export async function updateIndustry(
  id: Industry["id"],
  industry: UpdateIndustryDto
) {
  const response = await api.patch<Industry>(`/industry/${id}`, industry);
  return response.data;
}

export async function deleteIndustry(id: Industry["id"]) {
  const response = await api.delete(`/industry/${id}`);
  return response.data;
}
