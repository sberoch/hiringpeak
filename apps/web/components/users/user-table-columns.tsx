"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { ROLES_NAMES, User } from "@workspace/shared/types/user";
import { DeleteUserDialog } from "@/components/users/delete-user-dialog";
import { EditUserSheet } from "@/components/users/edit-user-sheet";

interface CellActionsProps {
  user: User;
}

const CellActions = ({ user }: CellActionsProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setIsEditSheetOpen(true)}
          >
            Editar usuario
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600 cursor-pointer"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Eliminar usuario
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {isDeleteDialogOpen && (
        <DeleteUserDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          user={user}
        />
      )}
      {isEditSheetOpen && (
        <EditUserSheet
          isOpen={isEditSheetOpen}
          onClose={() => setIsEditSheetOpen(false)}
          user={user}
        />
      )}
    </>
  );
};

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-gray-700 hover:text-gray-900 hover:bg-transparent dark:text-gray-300 dark:hover:text-gray-100"
        >
          Nombre
          <ArrowUpDown className="ml-2 h-3 w-3 opacity-60" />
        </Button>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-gray-700 hover:text-gray-900 hover:bg-transparent dark:text-gray-300 dark:hover:text-gray-100"
        >
          Email
          <ArrowUpDown className="ml-2 h-3 w-3 opacity-60" />
        </Button>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Rol",
    cell: ({ row }) => {
      return <div>{ROLES_NAMES[row.original.role]}</div>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Fecha de creación",
    cell: ({ row }) => {
      const createdAt = new Date(row.getValue("createdAt"));
      return <div>{createdAt.toLocaleDateString()}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <CellActions user={row.original} />,
  },
];
