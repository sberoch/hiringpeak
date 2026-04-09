"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

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
import { cn } from "@/lib/utils";
import { downloadFile } from "@/lib/download";
import { downloadCompanyReportPdf } from "@/lib/api/company";
import { DeleteCompanyDialog } from "@/components/companies/delete-company-dialog";
import { EditCompanySheet } from "@/components/companies/edit-company-sheet";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PermissionCode } from "@workspace/shared/enums";

interface CellActionsProps {
  company: Company;
}

const CellActions = ({ company }: CellActionsProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

  const downloadReportMutation = useMutation({
    mutationFn: () => downloadCompanyReportPdf(String(company.id)),
    onSuccess: (file) => {
      downloadFile(file);
    },
    onError: () => {
      toast.error("No se pudo descargar el reporte PDF.");
    },
  });

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
          <DropdownMenuItem
            className="cursor-pointer"
            disabled={downloadReportMutation.isPending}
            onSelect={(e) => {
              e.preventDefault();
              downloadReportMutation.mutate();
            }}
          >
            {downloadReportMutation.isPending
              ? "Generando PDF..."
              : "Descargar reporte"}
          </DropdownMenuItem>
          <PermissionGuard permissions={[PermissionCode.COMPANY_MANAGE]}>
            <DropdownMenuItem
              className="text-red-600 cursor-pointer"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Eliminar empresa
            </DropdownMenuItem>
          </PermissionGuard>
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
          className="h-auto font-semibold text-slate-brand hover:text-ink hover:bg-transparent transition-colors"
        >
          Nombre
          <ArrowUpDown className="ml-2 h-3 w-3 opacity-60" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <Link
          href={`/companies/${row.original.id}`}
          className="font-medium text-ink hover:text-electric transition-colors"
        >
          {row.original.name}
        </Link>
      );
    },
  },
  {
    accessorKey: "clientName",
    header: () => (
      <span className="pl-4 font-semibold text-slate-brand">Cliente</span>
    ),
    cell: ({ row }) => {
      const clientName = row.getValue("clientName") as string | undefined;
      return <div className="text-ink">{clientName || "-"}</div>;
    },
  },
  {
    accessorKey: "clientEmail",
    header: () => (
      <span className="pl-4 font-semibold text-slate-brand">Email cliente</span>
    ),
    cell: ({ row }) => {
      const clientEmail = row.getValue("clientEmail") as string | undefined;
      return (
        <div className="truncate max-w-[200px] text-slate-brand">
          {clientEmail || "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "clientPhone",
    header: () => (
      <span className="pl-4 font-semibold text-slate-brand">
        Teléfono cliente
      </span>
    ),
    cell: ({ row }) => {
      const clientPhone = row.getValue("clientPhone") as string | undefined;
      return <div className="text-slate-brand">{clientPhone || "-"}</div>;
    },
  },
  {
    accessorKey: "description",
    header: () => (
      <span className="pl-4 font-semibold text-slate-brand">Descripción</span>
    ),
    cell: ({ row }) => {
      const description = row.getValue("description") as string | undefined;
      return <div className="text-slate-brand">{description || "-"}</div>;
    },
  },
  {
    accessorKey: "vacancies",
    header: () => (
      <span className="pl-4 font-semibold text-slate-brand">Vacantes</span>
    ),
    cell: ({ row }) => {
      const count = row.original.vacancyCount || 0;
      return (
        <span className="inline-flex items-center rounded-lg bg-electric/5 px-2.5 py-0.5 text-xs font-semibold text-electric">
          {count}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: () => (
      <span className="pl-4 font-semibold text-slate-brand">Estado</span>
    ),
    cell: ({ row }) => {
      return (
        <Badge
          variant="secondary"
          className={cn(
            "rounded-lg text-xs font-semibold",
            row.original.status === CompanyStatusEnum.ACTIVE &&
              "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
            row.original.status === CompanyStatusEnum.PROSPECT &&
              "bg-amber-50 text-amber-700 hover:bg-amber-50",
          )}
        >
          {COMPANY_STATUS_NAMES[row.original.status]}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: () => (
      <span className="pl-4 font-semibold text-slate-brand">
        Fecha de creación
      </span>
    ),
    cell: ({ row }) => {
      if (!row.original.createdAt) return "-";

      const createdAt = new Date(row.getValue("createdAt"));
      return (
        <div className="text-slate-brand">{createdAt.toLocaleDateString()}</div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <CellActions company={row.original} />,
  },
];
