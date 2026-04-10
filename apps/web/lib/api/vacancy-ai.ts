import api from ".";
import type {
  CreateAiVacancyDto,
  ExtractVacancyAiResponse,
} from "@workspace/shared/types/vacancy-ai";
import type { Vacancy } from "@workspace/shared/types/vacancy";

export const VACANCY_AI_API_KEY = "vacancy-ai";

export async function extractVacancyWithAi(prompt: string) {
  const response = await api.post<ExtractVacancyAiResponse>("/vacancy/ai/extract", {
    prompt,
  });

  return response.data;
}

export async function createVacancyWithAi(payload: CreateAiVacancyDto) {
  const response = await api.post<Vacancy>("/vacancy/ai/create", payload);
  return response.data;
}

