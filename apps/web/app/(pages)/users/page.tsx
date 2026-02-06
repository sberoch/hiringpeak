"use client";

import { useQuery } from "@tanstack/react-query";

import { DataTable } from "@workspace/ui/components/data-table";
import { Heading } from "@workspace/ui/components/heading";
import { NewUserSheet } from "@/components/users/new-user-sheet";
import { columns } from "@/components/users/user-table-columns";
import { useUserFilters } from "@/hooks/use-user-filters";
import { USERS_API_KEY, getAllUsers } from "@/lib/api/user";

export default function Users() {
  const { filters, params, onPaginationChange, onSortingChange, setFilters } =
    useUserFilters({
      initialValues: { limit: 10, page: 1, order: "name:asc" },
    });

  const { data, isLoading } = useQuery({
    queryKey: [USERS_API_KEY, params],
    queryFn: () => getAllUsers(params),
  });

  return (
    <div className="container flex flex-col">
      <div className="flex items-center justify-between">
        <Heading>Usuarios</Heading>
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
