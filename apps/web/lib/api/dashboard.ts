import {
  CommercialSummary,
  Dashboard,
  RecruiterStats,
} from "@workspace/shared/types/dashboard";

import api from ".";

export const DASHBOARD_SUMMARY_API_KEY = "dashboard-summary";

export const RECRUITER_STATS_API_KEY = "recruiter-stats";

export async function getDashboardSummary() {
  const { data } = await api.get<Dashboard>("/dashboard");

  return data;
}

export async function getRecruiterStats() {
  const { data } = await api.get<RecruiterStats[]>(
    "/dashboard/recruiter-stats",
  );

  return data;
}

export const COMMERCIAL_SUMMARY_API_KEY = "commercial-summary";

export async function getCommercialSummary() {
  const { data } = await api.get<CommercialSummary>("/dashboard/commercial");

  return data;
}

export const MY_ACTIVE_VACANCIES_API_KEY = "my-active-vacancies";

export async function getMyActiveVacancyCount() {
  const { data } = await api.get<{ count: number }>(
    "/dashboard/my-active-vacancies",
  );

  return data;
}

export const CANDIDATES_ADDED_API_KEY = "candidates-added";

/** Candidates added in the last 30 days. */
export async function getCandidatesAddedCount() {
  const { data } = await api.get<{ count: number }>(
    "/dashboard/candidates-added",
  );

  return data;
}
