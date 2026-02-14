"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { DataTable } from "@workspace/ui/components/data-table";
import { Heading } from "@workspace/ui/components/heading";
import { EditPermissionSheet } from "@/components/permissions/edit-permission-sheet";
import { getPermissionTableColumns } from "@/components/permissions/permission-table-columns";
import { usePermissionFilters } from "@/hooks/use-permission-filters";
import {
  PERMISSIONS_API_KEY,
  getAllPermissions,
  type Permission,
} from "@/lib/api/permission";

export default function PermissionsPage() {
  const [editingPermission, setEditingPermission] =
    useState<Permission | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  const { filters, params, onPaginationChange, onSortingChange, setFilters } =
    usePermissionFilters({
      initialValues: { limit: 10, page: 1, order: "code:asc" },
    });

  const { data, isLoading } = useQuery({
    queryKey: [PERMISSIONS_API_KEY, params],
    queryFn: () => getAllPermissions(params),
  });

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setEditSheetOpen(true);
  };

  return (
    <div className="container flex flex-col">
      <div className="flex items-center justify-between">
        <Heading>Permisos</Heading>
      </div>
      <p className="text-muted-foreground mb-4">
        Los códigos de permiso son inmutables. Solo puedes editar la etiqueta y
        la descripción que se muestran a los usuarios.
      </p>
      <div className="w-full pb-4">
        <DataTable
          columns={getPermissionTableColumns(handleEdit)}
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
            value: filters.label ?? "",
            onSearchChange: (value) => {
              setFilters({ ...filters, label: value });
            },
          }}
          loading={isLoading && !data}
        />
      </div>
      <EditPermissionSheet
        permission={editingPermission}
        open={editSheetOpen}
        onOpenChange={(open) => {
          setEditSheetOpen(open);
          if (!open) setEditingPermission(null);
        }}
      />
    </div>
  );
}
