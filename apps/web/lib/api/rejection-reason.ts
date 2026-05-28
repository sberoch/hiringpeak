import { PaginatedResponse } from "@workspace/shared/types/api";
import {
  RejectionReason,
  RejectionReasonParams,
  CreateRejectionReasonDto,
  UpdateRejectionReasonDto,
} from "@workspace/shared/types/rejection-reason";

import api from ".";
import { filtersToSearchParams } from "../utils";

export const REJECTION_REASON_API_KEY = "rejectionReason";

export async function getRejectionReasons(params: RejectionReasonParams) {
  const searchParams = filtersToSearchParams(params);
  const response = await api.get<PaginatedResponse<RejectionReason>>(
    `/rejectionReason${searchParams}`
  );
  return response.data;
}

export async function createRejectionReason(
  rejectionReason: CreateRejectionReasonDto
) {
  const response = await api.post<RejectionReason>(
    "/rejectionReason",
    rejectionReason
  );
  return response.data;
}

export async function updateRejectionReason(
  id: RejectionReason["id"],
  rejectionReason: UpdateRejectionReasonDto
) {
  const response = await api.patch<RejectionReason>(
    `/rejectionReason/${id}`,
    rejectionReason
  );
  return response.data;
}

export async function deleteRejectionReason(id: RejectionReason["id"]) {
  const response = await api.delete(`/rejectionReason/${id}`);
  return response.data;
}
