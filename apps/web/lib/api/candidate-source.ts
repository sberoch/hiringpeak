import { PaginatedResponse } from "@workspace/shared/types/api";
import {
  CandidateSource,
  CandidateSourceParams,
  CreateCandidateSourceDto,
  UpdateCandidateSourceDto,
} from "@workspace/shared/types/candidate-source";

import api from ".";
import { filtersToSearchParams } from "../utils";

export const CANDIDATE_SOURCE_API_KEY = "candidateSource";

export async function getAllCandidateSources(params: CandidateSourceParams) {
  const searchParams = filtersToSearchParams(params);
  const response = await api.get<PaginatedResponse<CandidateSource>>(
    `/candidateSource${searchParams}`
  );
  return response.data;
}

export async function createCandidateSource(
  candidateSource: CreateCandidateSourceDto
) {
  const response = await api.post<CandidateSource>(
    "/candidateSource",
    candidateSource
  );
  return response.data;
}

export async function updateCandidateSource(
  id: CandidateSource["id"],
  candidateSource: UpdateCandidateSourceDto
) {
  const response = await api.patch<CandidateSource>(
    `/candidateSource/${id}`,
    candidateSource
  );
  return response.data;
}

export async function deleteCandidateSource(id: CandidateSource["id"]) {
  const response = await api.delete(`/candidateSource/${id}`);
  return response.data;
}
