import { PaginatedResponse } from "@workspace/shared/types/api";
import {
  Candidate,
  CandidateParams,
  CreateCandidateDto,
  UpdateCandidateDto,
} from "@workspace/shared/types/candidate";

import api from ".";
import { filtersToSearchParams } from "../utils";

export const CANDIDATE_API_KEY = "candidate";

export async function getAllCandidates(params: CandidateParams) {
  const searchParams = filtersToSearchParams(params);
  const response = await api.get<PaginatedResponse<Candidate>>(
    `/candidate${searchParams}`
  );
  return response.data;
}

export async function getCandidateById(id: number) {
  const response = await api.get<Candidate>(`/candidate/${id}`);
  return response.data;
}

export async function createCandidate(candidate: CreateCandidateDto) {
  const response = await api.post<Candidate>("/candidate", candidate);
  return response.data;
}

export async function updateCandidate(
  id: Candidate["id"],
  candidate: UpdateCandidateDto
) {
  const response = await api.patch<Candidate>(`/candidate/${id}`, candidate);
  return response.data;
}

export async function deleteCandidate(id: Candidate["id"]) {
  const response = await api.delete(`/candidate/${id}`);
  return response.data;
}

export async function checkCandidateExists(name: string) {
  const response = await api.get<{
    exists: boolean;
    candidate: Candidate | null;
  }>(`/candidate/exists?name=${encodeURIComponent(name)}`);
  return response.data;
}

export async function blacklistCandidate(id: Candidate["id"], reason: string) {
  const response = await api.post<Candidate>(`/candidate/${id}/blacklist`, {
    reason,
  });
  return response.data;
}
