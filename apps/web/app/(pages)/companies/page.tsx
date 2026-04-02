"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";

import { columns } from "@/components/companies/company-table-columns";
import { NewCompanySheet } from "@/components/companies/new-company-sheet";
import { DataTable } from "@workspace/ui/components/data-table";
import { useCompanyFilters } from "@/hooks/use-company-filters";
import { COMPANIES_API_KEY, getAllCompanies } from "@/lib/api/company";

export default function Companies() {
  const { filters, params, onPaginationChange, onSortingChange, setFilters } =
    useCompanyFilters({
      initialValues: { limit: 10, page: 1, order: "name:asc" },
    });

  const { data, isLoading } = useQuery({
    queryKey: [COMPANIES_API_KEY, params],
    queryFn: () => getAllCompanies(params),
  });
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric text-white shadow-[0_2px_8px_-2px_rgba(0,102,255,0.4)]">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Empresas
            </h1>
            <p className="text-sm text-slate-brand leading-relaxed">
              Gestiona las empresas y sus datos de contacto.
            </p>
          </div>
        </div>
        <NewCompanySheet />
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
