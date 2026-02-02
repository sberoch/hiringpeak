import { EditCandidateVacancySchema } from "@/components/candidate-vacancies/edit-candidate-vacancy.schema";
import { CreateCandidateVacancySchema } from "@/components/candidate-vacancies/new-candidate-vacancy.schema";

import { PaginatedResponse } from "@workspace/shared/types/api";
import {
  CandidateVacancy,
  CandidateVacancyParams,
} from "@workspace/shared/types/vacancy";

import api from ".";
import { filtersToSearchParams } from "../utils";

export const CANDIDATE_VACANCY_API_KEY = "candidateVacancy";

export async function getCandidateVacancyById(id: string) {
  const response = await api.get<CandidateVacancy>(`/candidateVacancy/${id}`);
  return response.data;
}

export async function getCandidateVacancies(params: CandidateVacancyParams) {
  const searchParams = filtersToSearchParams(params);
  const response = await api.get<PaginatedResponse<CandidateVacancy>>(
    `/candidateVacancy/${searchParams}`
  );
  return response.data;
}

export async function createCandidateVacancy(
  candidateVacancy: CreateCandidateVacancySchema
) {
  const response = await api.post<CandidateVacancy>(
    "/candidateVacancy",
    candidateVacancy
  );
  return response.data;
}

export async function updateCandidateVacancy(
  id: string,
  candidateVacancy: EditCandidateVacancySchema
) {
  const response = await api.patch<CandidateVacancy>(
    `/candidateVacancy/${id}`,
    candidateVacancy
  );
  return response.data;
}

export async function deleteCandidateVacancy(id: string) {
  const response = await api.delete(`/candidateVacancy/${id}`);
  return response.data;
}
