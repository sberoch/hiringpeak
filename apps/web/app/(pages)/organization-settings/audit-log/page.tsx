"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { PageHeading } from "@workspace/ui/components/page-heading";

import { Button } from "@workspace/ui/components/button";
import { AuditLogFilters } from "@/components/audit-log/audit-log-filters";
import { AuditLogTable } from "@/components/audit-log/audit-log-table";
import { useAuditLogFilters } from "@/hooks/use-audit-log-filters";
import {
  AUDIT_LOG_API_KEY,
  downloadAuditLogCsv,
  getAllAuditLogs,
} from "@/lib/api/audit-log";

export default function OrganizationSettingsAuditLogPage() {
  const { filters, setFilters, params, resetFilters } = useAuditLogFilters({
    initialValues: { limit: 25, page: 1, order: "createdAt:desc" },
  });

  const { data, isLoading } = useQuery({
    queryKey: [AUDIT_LOG_API_KEY, params],
    queryFn: () => getAllAuditLogs(params),
  });

  const exportMutation = useMutation({
    mutationFn: () => downloadAuditLogCsv(params),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `registro-auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
  });

  const pageIndex = (filters.page ?? 1) - 1;
  const pageSize = filters.limit ?? 25;
  const pageCount = data?.meta.totalPages ?? 1;

  const hasFilters = Boolean(
    filters.actorUserId ||
      filters.entityType ||
      filters.eventType ||
      filters.dateFrom ||
      filters.dateTo
  );

  return (
    <div className="flex flex-col">
      <div className="flex flex-row items-start justify-between mb-6 gap-4">
        <PageHeading
          icon={FileText}
          title="Registro de auditoría"
          description="Historial de acciones realizadas en la organización."
        />
        <Button
          size="sm"
          variant="brand-ghost"
          className="bg-white"
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending || (data?.items.length ?? 0) === 0}
        >
          <Download className="h-4 w-4 mr-1.5" />
          {exportMutation.isPending ? "Generando CSV..." : "Exportar CSV"}
        </Button>
      </div>
      <div className="mb-4">
        <AuditLogFilters
          filters={filters}
          onFiltersChange={setFilters}
          resetFilters={resetFilters}
        />
      </div>
      <div className="w-full pb-4">
        <AuditLogTable
          items={data?.items ?? []}
          totalItems={data?.meta.totalItems ?? 0}
          pageIndex={pageIndex}
          pageSize={pageSize}
          pageCount={pageCount}
          loading={isLoading && !data}
          hasFilters={hasFilters}
          onPageChange={(page) =>
            setFilters({ ...filters, page })
          }
          onPageSizeChange={(limit) =>
            setFilters({ ...filters, limit, page: 1 })
          }
          onActorClick={(actorUserId) =>
            setFilters({ ...filters, actorUserId, page: 1 })
          }
          onEventClick={(eventType) =>
            setFilters({ ...filters, eventType, page: 1 })
          }
          onClearFilters={resetFilters}
        />
      </div>
    </div>
  );
}
