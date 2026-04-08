"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Shield } from "lucide-react";
import { PageHeading } from "@workspace/ui/components/page-heading";
import { Button } from "@workspace/ui/components/button";
import { DataTable } from "@workspace/ui/components/data-table";
import { useRoleFilters } from "@/hooks/use-role-filters";
import { ROLES_API_KEY, getAllRoles, type Role } from "@/lib/api/role";

const roleColumns: ColumnDef<Role>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-semibold text-slate-brand hover:text-ink hover:bg-transparent transition-colors"
      >
        Nombre
        <ArrowUpDown className="ml-2 h-3 w-3 opacity-60" />
      </Button>
    ),
  },
  {
    accessorKey: "isSystem",
    header: () => <span className="pl-4 font-semibold text-slate-brand">Tipo</span>,
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold ${
          row.original.isSystem
            ? "bg-amber-50 text-amber-700"
            : "bg-electric/5 text-electric"
        }`}
      >
        {row.original.isSystem ? "Sistema" : "Personalizado"}
      </span>
    ),
  },
];

export default function OrganizationSettingsRolesPage() {
  const { filters, params, onPaginationChange, onSortingChange } =
    useRoleFilters({
      initialValues: { limit: 10, page: 1, order: "name:asc" },
    });

  const { data, isLoading } = useQuery({
    queryKey: [ROLES_API_KEY, params],
    queryFn: () => getAllRoles(params),
  });

  return (
    <div className="flex flex-col">
      <PageHeading
        icon={Shield}
        title="Roles y permisos"
        description="Gestiona los roles de la organización y asigna permisos."
        className="mb-6"
      />
      <div className="w-full pb-4">
        <DataTable<Role, unknown>
          columns={roleColumns}
          data={data?.items ?? []}
          pagination={{
            totalItems: data?.meta?.totalItems ?? 0,
            pageCount: data?.meta?.totalPages ?? 1,
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
