"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Pencil } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import type { Permission } from "@/lib/api/permission";

export function getPermissionTableColumns(
  onEdit?: (permission: Permission) => void
): ColumnDef<Permission>[] {
  return [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-gray-700 hover:text-gray-900 hover:bg-transparent dark:text-gray-300 dark:hover:text-gray-100"
        >
          Código
          <ArrowUpDown className="ml-2 h-3 w-3 opacity-60" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.getValue("code") as string}</span>
      ),
    },
    {
      accessorKey: "label",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-gray-700 hover:text-gray-900 hover:bg-transparent dark:text-gray-300 dark:hover:text-gray-100"
        >
          Etiqueta
          <ArrowUpDown className="ml-2 h-3 w-3 opacity-60" />
        </Button>
      ),
      cell: ({ row }) => <span>{row.getValue("label") as string}</span>,
    },
    {
      accessorKey: "description",
      header: "Descripción",
      cell: ({ row }) => {
        const desc = row.getValue("description") as string | null;
        return (
          <span className="text-muted-foreground max-w-md truncate block">
            {desc ?? "—"}
          </span>
        );
      },
    },
    ...(onEdit
      ? [
          {
            id: "actions",
            header: "",
            cell: ({ row }: { row: { original: Permission } }) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(row.original)}
                className="h-8 w-8 p-0"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            ),
          } as ColumnDef<Permission>,
        ]
      : []),
  ];
}
