import type {
  ChangeOpportunityStagePayload,
  CommercialUser,
  CreateOpportunityPayload,
  CreateVacancyFromOpportunityPayload,
  LostReason,
  Opportunity,
  OpportunityDetail,
  OpportunityFilters,
  OpportunityStage,
  UpdateOpportunityPayload,
} from "@workspace/shared/types/opportunity";

import api from ".";
import { filtersToSearchParams } from "../utils";

export const OPPORTUNITY_API_KEY = "opportunity";
export const OPPORTUNITY_STAGE_API_KEY = "opportunityStage";
export const LOST_REASON_API_KEY = "lostReason";
export const COMMERCIAL_USERS_API_KEY = "commercialUsers";

export async function getOpportunities(filters: OpportunityFilters) {
  const response = await api.get<Opportunity[]>(
    `/opportunity${filtersToSearchParams(filters)}`,
  );
  return response.data;
}

export async function getOpportunity(id: number | string) {
  const response = await api.get<OpportunityDetail>(`/opportunity/${id}`);
  return response.data;
}

export async function createOpportunity(payload: CreateOpportunityPayload) {
  const response = await api.post<Opportunity>("/opportunity", payload);
  return response.data;
}

export async function updateOpportunity(
  id: number,
  payload: UpdateOpportunityPayload,
) {
  const response = await api.patch<Opportunity>(`/opportunity/${id}`, payload);
  return response.data;
}

export async function changeOpportunityStage(
  id: number,
  payload: ChangeOpportunityStagePayload,
) {
  const response = await api.post<Opportunity>(
    `/opportunity/${id}/stage`,
    payload,
  );
  return response.data;
}

export async function updateOpportunityCloseDate(
  id: number,
  closeDate: string,
) {
  const response = await api.patch<Opportunity>(
    `/opportunity/${id}/close-date`,
    { closeDate },
  );
  return response.data;
}

/** "Crear vacante": one Vacancy on the won Opportunity's Company, linked to it. */
export async function createVacancyFromOpportunity(
  id: number,
  payload: CreateVacancyFromOpportunityPayload,
) {
  const response = await api.post<{ id: number; title: string }>(
    `/opportunity/${id}/vacancy`,
    payload,
  );
  return response.data;
}

export async function deleteOpportunity(id: number) {
  const response = await api.delete<Opportunity>(`/opportunity/${id}`);
  return response.data;
}

export async function getOpportunityStages() {
  const response = await api.get<OpportunityStage[]>("/opportunityStage");
  return response.data;
}

export async function getLostReasons() {
  const response = await api.get<LostReason[]>("/lostReason");
  return response.data;
}

/** Users who can own commercial records (CRM_READ or CRM_MANAGE). */
export async function getCommercialUsers() {
  const response = await api.get<CommercialUser[]>("/user/commercial");
  return response.data;
}
