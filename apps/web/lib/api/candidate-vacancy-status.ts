import { PaginatedResponse } from "@workspace/shared/types/api";
import {
  CandidateVacancyStatus,
  CandidateVacancyStatusParams,
} from "@workspace/shared/types/candidate-vacancy-status";
import type {
  CreateCandidateVacancyStatusDto,
  UpdateCandidateVacancyStatusDto,
} from "@workspace/shared/dtos";

import api from ".";
import { filtersToSearchParams } from "../utils";

export const CANDIDATE_VACANCY_STATUS_API_KEY = "candidateVacancyStatus";

export async function getCandidateVacancyStatus(
  params: CandidateVacancyStatusParams
) {
  const searchParams = filtersToSearchParams(params);
  const response = await api.get<PaginatedResponse<CandidateVacancyStatus>>(
    `/candidateVacancyStatus${searchParams}`
  );
  return response.data;
}

export async function createCandidateVacancyStatus(
  candidateVacancyStatus: CreateCandidateVacancyStatusDto
) {
  const response = await api.post<CandidateVacancyStatus>(
    "/candidateVacancyStatus",
    candidateVacancyStatus
  );
  return response.data;
}

export async function updateCandidateVacancyStatus(
  id: CandidateVacancyStatus["id"],
  candidateVacancyStatus: UpdateCandidateVacancyStatusDto
) {
  const response = await api.patch<CandidateVacancyStatus>(
    `/candidateVacancyStatus/${id}`,
    candidateVacancyStatus
  );
  return response.data;
}

export async function deleteCandidateVacancyStatus(id: string) {
  const response = await api.delete(`/candidateVacancyStatus/${id}`);
  return response.data;
}

export async function getAllCandidateVacancyStatus(
  params: CandidateVacancyStatusParams
) {
  const searchParams = filtersToSearchParams(params);
  const response = await api.get<PaginatedResponse<CandidateVacancyStatus>>(
    `/candidateVacancyStatus${searchParams}`
  );
  return response.data;
}
