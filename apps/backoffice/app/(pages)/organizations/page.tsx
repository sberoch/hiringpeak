"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { DataTable } from "@workspace/ui/components/data-table";
import { Heading } from "@workspace/ui/components/heading";
import { NewOrganizationSheet } from "@/components/organizations/new-organization-sheet";
import { OrganizationDetailModal } from "@/components/organizations/organization-detail-modal";
import { getOrganizationTableColumns } from "@/components/organizations/organization-table-columns";
import { useOrganizationFilters } from "@/hooks/use-organization-filters";
import {
  ORGANIZATIONS_API_KEY,
  getAllOrganizations,
} from "@/lib/api/organization";
import type { Organization } from "@workspace/shared/schemas";

export default function OrganizationsPage() {
  const [detailOrgId, setDetailOrgId] = useState<number | null>(null);

  const { filters, params, onPaginationChange, onSortingChange, setFilters } =
    useOrganizationFilters({
      initialValues: { limit: 10, page: 1, order: "name:asc" },
    });

  const { data, isLoading } = useQuery({
    queryKey: [ORGANIZATIONS_API_KEY, params],
    queryFn: () => getAllOrganizations(params),
  });

  const handleOrganizationClick = (org: Organization) => {
    setDetailOrgId(org.id);
  };

  return (
    <div className="container flex flex-col">
      <div className="flex items-center justify-between">
        <Heading>Organizaciones</Heading>
        <NewOrganizationSheet />
      </div>
      <div className="w-full pb-4">
        <DataTable
          columns={getOrganizationTableColumns(handleOrganizationClick)}
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
          search={{
            value: filters.name ?? "",
            onSearchChange: (value) => {
              setFilters({ ...filters, name: value });
            },
          }}
          loading={isLoading && !data}
        />
      </div>
      <OrganizationDetailModal
        organizationId={detailOrgId}
        onClose={() => setDetailOrgId(null)}
      />
    </div>
  );
}
