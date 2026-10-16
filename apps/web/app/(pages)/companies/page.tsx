"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { PageHeading } from "@workspace/ui/components/page-heading";

import {
  ActiveFilterChips,
  activeFilterCount,
  CompanyFilterPanel,
} from "@/components/companies/company-filter-panel";
import { companyColumns } from "@/components/companies/company-table-columns";
import { NewCompanySheet } from "@/components/companies/new-company-sheet";
import { useCommercialAccess } from "@/components/opportunities/commercial-access";
import { DataTable } from "@workspace/ui/components/data-table";
import { useCompanyFilters } from "@/hooks/use-company-filters";
import { COMPANIES_API_KEY, getAllCompanies } from "@/lib/api/company";

export default function Companies() {
  const { canRead: commercial } = useCommercialAccess();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { filters, params, onPaginationChange, onSortingChange, setFilters } =
    useCompanyFilters({
      initialValues: { limit: 10, page: 1, order: "name:asc" },
    });
  const columns = useMemo(() => companyColumns(commercial), [commercial]);
  const filterCount = activeFilterCount(filters);

  const { data, isLoading } = useQuery({
    queryKey: [COMPANIES_API_KEY, params],
    queryFn: () => getAllCompanies(params),
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
      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-brand" />
          <Input
            type="search"
            placeholder="Buscar por nombre…"
            className="rounded-xl border-brand-border bg-surface pl-9 placeholder:text-muted-brand focus:border-electric focus:ring-electric/10"
            value={filters.name ?? ""}
            onChange={(event) =>
              setFilters({ ...filters, name: event.target.value, page: 1 })
            }
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setFiltersOpen(true)}
          className="relative gap-2 rounded-xl border-brand-border text-slate-brand transition-all hover:border-electric hover:bg-electric/5 hover:text-ink"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {filterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-electric px-1.5 text-[11px] font-bold text-white">
              {filterCount}
            </span>
          )}
        </Button>
      </div>

      {filterCount > 0 && (
        <div className="mb-4">
          <ActiveFilterChips filters={filters} onFiltersChange={setFilters} />
        </div>
      )}

      <CompanyFilterPanel
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onFiltersChange={setFilters}
        commercial={commercial}
      />

      <div className="w-full pb-4">
        <DataTable
          columns={columns}
          loading={isLoading && !data}
          data={data?.items || []}
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
