"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@workspace/ui/components/data-table";
import { Heading } from "@workspace/ui/components/heading";
import { ROLES_API_KEY, getAllRoles, type Role } from "@/lib/api/role";
import { useMemo, useState } from "react";

const roleColumns: ColumnDef<Role>[] = [
  { accessorKey: "name", header: "Nombre" },
  { accessorKey: "id", header: "ID" },
];

export default function OrganizationSettingsRolesPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const { data, isLoading } = useQuery({
    queryKey: [ROLES_API_KEY, { page, limit, order: "name:asc" }],
    queryFn: () => getAllRoles({ page, limit, order: "name:asc" }),
  });

  const tableColumns = useMemo(() => roleColumns, []);

  return (
    <div className="container flex flex-col">
      <div className="flex items-center justify-between">
        <Heading>Roles y permisos</Heading>
      </div>
      <p className="text-muted-foreground mb-4">
        Gestiona los roles de la organización y asigna permisos. Los cambios se
        aplican a los usuarios que tengan cada role asignado.
      </p>
      <div className="w-full pb-4">
        <DataTable<Role, unknown>
          columns={tableColumns}
          data={data?.items ?? []}
          pagination={{
            totalItems: data?.meta?.totalItems ?? 0,
            pageCount: data?.meta?.totalPages ?? 1,
            pageIndex: page - 1,
            pageSize: limit,
            onPaginationChange: (updater) => {
              const next = typeof updater === "function" ? updater({ pageIndex: page - 1, pageSize: limit }) : updater;
              setPage((next?.pageIndex ?? 0) + 1);
            },
          }}
          sorting={{ order: "name:asc", onSortingChange: () => {} }}
          loading={isLoading && !data}
        />
      </div>
    </div>
  );
}
