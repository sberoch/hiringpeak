import { EditVacancySchema } from "@/components/vacancies/edit-vacancy.schema";
import { CreateVacancySchema } from "@/components/vacancies/new-vacancy.schema";
import { PaginatedResponse } from "@workspace/shared/types/api";
import { Vacancy, VacancyParams } from "@workspace/shared/types/vacancy";

import api from ".";
import { filtersToSearchParams } from "../utils";

export const VACANCY_API_KEY = "vacancy";

export async function getAllVacancies(params: VacancyParams) {
  const searchParams = filtersToSearchParams(params);
  const response = await api.get<PaginatedResponse<Vacancy>>(
    `/vacancy${searchParams}`
  );
  return response.data;
}

export async function getVacancyById(id: string) {
  const response = await api.get<Vacancy>(`/vacancy/${id}`);
  return response.data;
}

export async function createVacancy(vacancy: CreateVacancySchema) {
  const response = await api.post<Vacancy>("/vacancy", vacancy);
  return response.data;
}

export async function updateVacancy(id: string, vacancy: EditVacancySchema) {
  const response = await api.patch<Vacancy>(`/vacancy/${id}`, vacancy);
  return response.data;
}

export async function deleteVacancy(id: string) {
  const response = await api.delete(`/vacancy/${id}`);
  return response.data;
}
