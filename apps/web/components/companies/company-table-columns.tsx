"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Company,
  COMPANY_STATUS_NAMES,
  CompanyStatusEnum,
} from "@workspace/shared/types/company";
import { UserRoleEnum } from "@workspace/shared/types/user";
import { cn } from "@/lib/utils";
import { DeleteCompanyDialog } from "@/components/companies/delete-company-dialog";
import { EditCompanySheet } from "@/components/companies/edit-company-sheet";
import { RBACAuthzGuard } from "@/components/auth/rbac-authz-guard";

interface CellActionsProps {
  company: Company;
}

const CellActions = ({ company }: CellActionsProps) => {
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
            Editar empresa
          </DropdownMenuItem>
          <RBACAuthzGuard visibleTo={[UserRoleEnum.ADMIN, UserRoleEnum.MANAGER]}>
            <DropdownMenuItem
              className="text-red-600 cursor-pointer"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Eliminar empresa
            </DropdownMenuItem>
          </RBACAuthzGuard>
        </DropdownMenuContent>
      </DropdownMenu>
      {isDeleteDialogOpen && (
        <DeleteCompanyDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          company={company}
        />
      )}
      {isEditSheetOpen && (
        <EditCompanySheet
          isOpen={isEditSheetOpen}
          onClose={() => setIsEditSheetOpen(false)}
          company={company}
        />
      )}
    </>
  );
};

export const columns: ColumnDef<Company>[] = [
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
    accessorKey: "clientName",
    header: "Cliente",
    cell: ({ row }) => {
      const clientName = row.getValue("clientName") as string | undefined;
      return <div>{clientName || "-"}</div>;
    },
  },
  {
    accessorKey: "clientEmail",
    header: "Email cliente",
    cell: ({ row }) => {
      const clientEmail = row.getValue("clientEmail") as string | undefined;
      return <div className="truncate max-w-[200px]">{clientEmail || "-"}</div>;
    },
  },
  {
    accessorKey: "clientPhone",
    header: "Teléfono cliente",
    cell: ({ row }) => {
      const clientPhone = row.getValue("clientPhone") as string | undefined;
      return <div>{clientPhone || "-"}</div>;
    },
  },
  {
    accessorKey: "description",
    header: "Descripción",
    cell: ({ row }) => {
      const description = row.getValue("description") as string | undefined;
      return <div>{description || "-"}</div>;
    },
  },
  {
    accessorKey: "vacancies",
    header: "Vacantes",
    cell: ({ row }) => {
      return <div>{row.original.vacancyCount || 0}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      return (
        <Badge
          variant="secondary"
          className={cn(
            row.original.status === CompanyStatusEnum.ACTIVE &&
            "bg-green-200 hover:bg-green-200",
            row.original.status === CompanyStatusEnum.PROSPECT &&
            "bg-orange-200 hover:bg-orange-200"
          )}
        >
          {COMPANY_STATUS_NAMES[row.original.status]}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Fecha de creación",
    cell: ({ row }) => {
      if (!row.original.createdAt) return "-";

      const createdAt = new Date(row.getValue("createdAt"));
      return <div>{createdAt.toLocaleDateString()}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <CellActions company={row.original} />,
  },
];
