"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { PageHeading } from "@workspace/ui/components/page-heading";

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
        <PageHeading
          icon={Building2}
          title="Empresas"
          description="Gestiona las empresas y sus datos de contacto."
        />
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
