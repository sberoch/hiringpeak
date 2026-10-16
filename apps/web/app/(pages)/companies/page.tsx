"use client";

import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { PageHeading } from "@workspace/ui/components/page-heading";
import { cn } from "@workspace/ui/lib/utils";
import { CompanyStatus } from "@workspace/shared/enums";
import type { CompanyFilters } from "@workspace/shared/types/company";

import { companyColumns } from "@/components/companies/company-table-columns";
import { NewCompanySheet } from "@/components/companies/new-company-sheet";
import { useCurrentUserId } from "@/components/contacts/contact-lookups";
import { useCommercialAccess } from "@/components/opportunities/commercial-access";
import { DataTable } from "@workspace/ui/components/data-table";
import { useCompanyFilters } from "@/hooks/use-company-filters";
import { COMPANIES_API_KEY, getAllCompanies } from "@/lib/api/company";

const STATUS_CHIPS: { status: CompanyStatus | undefined; label: string }[] = [
  { status: undefined, label: "Todas" },
  { status: CompanyStatus.PROSPECT, label: "Prospectos" },
  { status: CompanyStatus.CLIENT, label: "Clientes" },
];

export default function Companies() {
  const { canRead: commercial } = useCommercialAccess();
  const me = useCurrentUserId();
  const { filters, params, onPaginationChange, onSortingChange, setFilters } =
    useCompanyFilters({
      initialValues: { limit: 10, page: 1, order: "name:asc" },
    });
  const columns = useMemo(() => companyColumns(commercial), [commercial]);

  const { data, isLoading } = useQuery({
    queryKey: [COMPANIES_API_KEY, params],
    queryFn: () => getAllCompanies(params),
  });

  // Chip counts: same search and "Mis cuentas", each status.
  const countParams = (status: CompanyStatus | undefined): CompanyFilters => ({
    page: 1,
    limit: 1,
    name: params.name,
    accountOwnerId: params.accountOwnerId,
    status,
  });
  const counts = useQueries({
    queries: STATUS_CHIPS.map((chip) => ({
      queryKey: [COMPANIES_API_KEY, "count", countParams(chip.status)],
      queryFn: () => getAllCompanies(countParams(chip.status)),
    })),
  });

  const mine = filters.accountOwnerId != null;
  const setStatus = (status: CompanyStatus | undefined) =>
    setFilters({ ...filters, status, page: 1 });
  const toggleMine = () =>
    setFilters({
      ...filters,
      accountOwnerId: mine || me == null ? undefined : me,
      page: 1,
    });

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <PageHeading
          icon={Building2}
          title="Empresas"
          description="Prospectos y clientes, con sus contactos."
        />
        <NewCompanySheet />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-full border border-brand-border bg-surface p-1">
          {STATUS_CHIPS.map((chip, index) => {
            const active = filters.status === chip.status;
            const count = counts[index]?.data?.meta.totalItems;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => setStatus(chip.status)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-electric text-white"
                    : "text-slate-brand hover:bg-brand-border-light",
                )}
              >
                {chip.label}
                {count != null && (
                  <span
                    className={cn(
                      "ml-1",
                      active ? "text-white/70" : "text-muted-brand",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {commercial && (
          <button
            type="button"
            onClick={toggleMine}
            aria-pressed={mine}
            className={cn(
              "rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
              mine
                ? "border-electric bg-electric/10 text-electric"
                : "border-brand-border bg-surface text-slate-brand hover:border-electric/40",
            )}
          >
            Mis cuentas
          </button>
        )}
      </div>
      <div className="w-full pb-4">
        <DataTable
          columns={columns}
          loading={isLoading && !data}
          data={data?.items || []}
          search={{
            value: filters.name ?? "",
            onSearchChange: (value) => {
              setFilters({ ...filters, name: value });
            },
          }}
          pagination={{
            totalItems: data?.meta.totalItems || 1,
            pageCount: data?.meta.totalPages || 1,
            pageIndex: (filters.page || 1) - 1,
            pageSize: filters.limit || 10,
            onPaginationChange,
          }}
          sorting={{
            order: filters.order,
            onSortingChange,
          }}
        />
      </div>
    </div>
  );
}
