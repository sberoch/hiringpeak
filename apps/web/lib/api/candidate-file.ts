import {
  BaseCandidateFile,
  CandidateFile,
} from "@workspace/shared/types/candidate";

import api from ".";

export const CANDIDATE_FILE_API_KEY = "candidate-file";

export async function createCandidateFile(candidateFile: BaseCandidateFile) {
  const response = await api.post<CandidateFile>(
    "/candidatefile",
    candidateFile
  );
  return response.data;
}
