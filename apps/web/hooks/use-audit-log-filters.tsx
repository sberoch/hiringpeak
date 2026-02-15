import { useFilters } from "./use-filters";

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  order?: string;
  actorUserId?: number;
  entityType?: string;
  eventType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export type AuditLogParams = AuditLogFilters;

function transformFiltersToParams(filters?: AuditLogFilters): AuditLogParams {
  if (!filters) return {};
  return { ...filters };
}

interface Props {
  initialValues?: AuditLogFilters;
  debounce?: number;
}

export function useAuditLogFilters(props?: Props) {
  return useFilters<AuditLogFilters, AuditLogParams>({
    initialValues: props?.initialValues,
    debounce: props?.debounce,
    transformFilters: transformFiltersToParams,
  });
}
