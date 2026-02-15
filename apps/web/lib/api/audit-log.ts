import type { AuditLogItem } from "@workspace/shared/types/audit-log";
import { PaginatedResponse } from "@workspace/shared/types/api";

import api from ".";
import { filtersToSearchParams } from "../utils";

export const AUDIT_LOG_API_KEY = "audit-log";

export interface AuditLogParams {
  page?: number;
  limit?: number;
  order?: string;
  actorUserId?: number;
  entityType?: string;
  eventType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getAllAuditLogs(params: AuditLogParams) {
  const searchParams = filtersToSearchParams(
    params as Parameters<typeof filtersToSearchParams>[0]
  );
  const response = await api.get<PaginatedResponse<AuditLogItem>>(
    `/audit-log${searchParams}`
  );
  return response.data;
}
