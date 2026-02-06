import { PaginatedResponse } from "@workspace/shared/types/api";
import {
  CreateVacancyStatusDto,
  UpdateVacancyStatusDto,
  VacancyStatus,
  VacancyStatusParams,
} from "@workspace/shared/types/vacancy-status";

import api from ".";
import { filtersToSearchParams } from "../utils";

export const VACANCY_STATUS_API_KEY = "vacancyStatus";

export async function getAllVacancyStatuses(params: VacancyStatusParams) {
  const searchParams = filtersToSearchParams(params);
  const response = await api.get<PaginatedResponse<VacancyStatus>>(
    `/vacancyStatus${searchParams}`
  );
  return response.data;
}

export async function createVacancyStatus(status: CreateVacancyStatusDto) {
  const response = await api.post<VacancyStatus>("/vacancyStatus", status);
  return response.data;
}

export async function updateVacancyStatus(
  id: VacancyStatus["id"],
  status: UpdateVacancyStatusDto
) {
  const response = await api.patch<VacancyStatus>(
    `/vacancyStatus/${id}`,
    status
  );
  return response.data;
}

export async function deleteVacancyStatus(id: string) {
  const response = await api.delete(`/vacancyStatus/${id}`);
  return response.data;
}
