import api from ".";
import type {
  AiVacancyRunDetail,
  AiVacancyRunSummary,
  CreateAiVacancyDto,
  ExtractVacancyAiResponse,
} from "@workspace/shared/types/vacancy-ai";
import type { Vacancy } from "@workspace/shared/types/vacancy";

export const VACANCY_AI_API_KEY = "vacancy-ai";

export type ExtractVacancyWithAiInput = {
  prompt?: string;
  files?: File[];
};

export async function extractVacancyWithAi(input: ExtractVacancyWithAiInput) {
  const formData = new FormData();
  const trimmedPrompt = input.prompt?.trim();

  if (trimmedPrompt) {
    formData.append("prompt", trimmedPrompt);
  }

  for (const file of input.files ?? []) {
    formData.append("files", file);
  }

  const response = await api.post<ExtractVacancyAiResponse>(
    "/vacancy/ai/extract",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
}

export async function createVacancyWithAi(payload: CreateAiVacancyDto) {
  const response = await api.post<Vacancy>("/vacancy/ai/create", payload);
  return response.data;
}

export async function listAiVacancyRuns() {
  const response = await api.get<AiVacancyRunSummary[]>("/vacancy/ai/runs");
  return response.data;
}

export async function getAiVacancyRun(token: string) {
  const response = await api.get<AiVacancyRunDetail>(`/vacancy/ai/runs/${token}`);
  return response.data;
}

export async function getVacancyAiSource(vacancyId: string | number) {
  const response = await api.get<AiVacancyRunDetail | null>(
    `/vacancy/${vacancyId}/ai-source`,
  );
  return response.data;
}
