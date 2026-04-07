"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Users } from "lucide-react";
import { PageHeading } from "@workspace/ui/components/page-heading";
import { DataTable } from "@workspace/ui/components/data-table";
import { NewUserSheet } from "@/components/users/new-user-sheet";
import { getColumns } from "@/components/users/user-table-columns";
import { useUserFilters } from "@/hooks/use-user-filters";
import { ROLES_API_KEY, getAllRoles } from "@/lib/api/role";
import { USERS_API_KEY, getAllUsers } from "@/lib/api/user";

export default function OrganizationSettingsUsersPage() {
  const { filters, params, onPaginationChange, onSortingChange, setFilters } =
    useUserFilters({
      initialValues: { limit: 10, page: 1, order: "name:asc" },
    });

  const { data, isLoading } = useQuery({
    queryKey: [USERS_API_KEY, params],
    queryFn: () => getAllUsers(params),
  });

  const { data: rolesData } = useQuery({
    queryKey: [ROLES_API_KEY],
    queryFn: () => getAllRoles({ limit: 100, page: 1 }),
  });
  const roleIdToName = useMemo(() => {
    const map: Record<number, string> = {};
    rolesData?.items?.forEach((r) => {
      map[r.id] = r.name;
    });
    return map;
  }, [rolesData?.items]);

  const columns = useMemo(
    () => getColumns(roleIdToName),
    [roleIdToName]
  );

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <PageHeading
          icon={Users}
          title="Usuarios"
          description="Gestiona los usuarios y sus roles dentro de la organización."
        />
        <NewUserSheet />
      </div>
      <div className="w-full pb-4">
        <DataTable
          columns={columns}
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
          search={{
            value: filters.name ?? "",
            onSearchChange: (value) => {
              setFilters({ ...filters, name: value });
            },
          }}
          loading={isLoading && !data}
        />
      </div>
    </div>
  );
}
