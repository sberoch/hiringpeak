"use client";

import { useQuery } from "@tanstack/react-query";

import { DataTable } from "@workspace/ui/components/data-table";
import { Heading } from "@workspace/ui/components/heading";
import { columns } from "@/components/audit-log/audit-log-table-columns";
import { useAuditLogFilters } from "@/hooks/use-audit-log-filters";
import { AUDIT_LOG_API_KEY, getAllAuditLogs } from "@/lib/api/audit-log";

export default function OrganizationSettingsAuditLogPage() {
  const { filters, params, onPaginationChange, onSortingChange } =
    useAuditLogFilters({
      initialValues: { limit: 10, page: 1, order: "createdAt:desc" },
    });

  const { data, isLoading } = useQuery({
    queryKey: [AUDIT_LOG_API_KEY, params],
    queryFn: () => getAllAuditLogs(params),
  });

  return (
    <div className="container flex flex-col">
      <div className="flex items-center justify-between">
        <Heading>Registro de auditoría</Heading>
      </div>
      <div className="w-full pb-4">
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          pagination={{
            totalItems: data?.meta.totalItems ?? 1,
            pageCount: data?.meta.totalPages ?? 1,
            pageIndex: (filters.page ?? 1) - 1,
            pageSize: filters.limit ?? 10,
            onPaginationChange,
          }}
          sorting={{
            order: filters.order,
            onSortingChange,
          }}
          loading={isLoading && !data}
        />
      </div>
    </div>
  );
}
