"use client";

import { useQuery } from "@tanstack/react-query";

import {
  COMMERCIAL_USERS_API_KEY,
  getCommercialUsers,
  getLostReasons,
  getOpportunityStages,
  LOST_REASON_API_KEY,
  OPPORTUNITY_STAGE_API_KEY,
} from "@/lib/api/opportunity";
import { sortOpportunityStages } from "@workspace/shared/lib/opportunity-stage";

/** Stages sorted for display (open by sort, then won, then lost). */
export function useOpportunityStages() {
  const query = useQuery({
    queryKey: [OPPORTUNITY_STAGE_API_KEY],
    queryFn: getOpportunityStages,
  });
  return {
    ...query,
    data: query.data ? sortOpportunityStages(query.data) : undefined,
  };
}

export function useLostReasons() {
  return useQuery({
    queryKey: [LOST_REASON_API_KEY],
    queryFn: getLostReasons,
  });
}

export function useCommercialUsers() {
  return useQuery({
    queryKey: [COMMERCIAL_USERS_API_KEY],
    queryFn: getCommercialUsers,
  });
}
