"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import type { Organization } from "@workspace/shared/schemas";

export function getOrganizationTableColumns(
  onOrganizationClick?: (org: Organization) => void
): ColumnDef<Organization>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-gray-700 hover:text-gray-900 hover:bg-transparent dark:text-gray-300 dark:hover:text-gray-100"
        >
          Nombre
          <ArrowUpDown className="ml-2 h-3 w-3 opacity-60" />
        </Button>
      ),
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        const org = row.original;
        if (onOrganizationClick) {
          return (
            <Button
              variant="ghost"
              className="h-auto p-0 font-medium text-primary hover:underline hover:bg-transparent text-left"
              onClick={() => onOrganizationClick(org)}
            >
              {name}
            </Button>
          );
        }
        return <div>{name}</div>;
      },
    },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-semibold text-gray-700 hover:text-gray-900 hover:bg-transparent dark:text-gray-300 dark:hover:text-gray-100"
      >
        Fecha de creación
        <ArrowUpDown className="ml-2 h-3 w-3 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt");
      if (!createdAt) return null;
      return (
        <div>{new Date(createdAt as string | Date).toLocaleDateString()}</div>
      );
    },
  },
  ];
}
