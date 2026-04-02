"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Users } from "lucide-react";
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
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric text-white shadow-[0_2px_8px_-2px_rgba(0,102,255,0.4)]">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Usuarios
            </h1>
            <p className="text-sm text-slate-brand leading-relaxed">
              Gestiona los usuarios y sus roles dentro de la organización.
            </p>
          </div>
        </div>
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
