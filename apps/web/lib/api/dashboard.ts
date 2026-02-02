import { Dashboard } from "@workspace/shared/types/dashboard";

import api from ".";

export async function getDashboardSummary() {
  const { data } = await api.get<Dashboard>("/dashboard");

  return data;
}
