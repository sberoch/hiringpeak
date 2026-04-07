import { Dashboard, RecruiterStats } from "@workspace/shared/types/dashboard";

import api from ".";

export const RECRUITER_STATS_API_KEY = "recruiter-stats";

export async function getDashboardSummary() {
  const { data } = await api.get<Dashboard>("/dashboard");

  return data;
}

export async function getRecruiterStats() {
  const { data } = await api.get<RecruiterStats[]>(
    "/dashboard/recruiter-stats"
  );

  return data;
}
