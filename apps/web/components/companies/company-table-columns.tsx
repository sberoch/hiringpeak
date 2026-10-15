"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import type { Company } from "@workspace/shared/types/company";
import { formatMoney } from "@/lib/utils";
import { downloadFile } from "@/lib/download";
import {
  downloadCompanyReportPdf,
  downloadCompanyReportXlsx,
} from "@/lib/api/company";
import { DeleteCompanyDialog } from "@/components/companies/delete-company-dialog";
import { EditCompanySheet } from "@/components/companies/edit-company-sheet";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PermissionCode } from "@workspace/shared/enums";
import { LastInteractionLabel } from "@/components/interactions/interaction-ui";
import {
  AccountOwnerControl,
  CompanyStatusBadge,
} from "@/components/companies/company-ui";

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
  const downloadReportXlsxMutation = useMutation({
    mutationFn: () => downloadCompanyReportXlsx(String(company.id)),
    onSuccess: (file) => {
      downloadFile(file);
    },
    onError: () => {
      toast.error("No se pudo descargar el reporte Excel.");
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
              : "Descargar PDF"}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            disabled={downloadReportXlsxMutation.isPending}
            onSelect={(e) => {
              e.preventDefault();
              downloadReportXlsxMutation.mutate();
            }}
          >
            {downloadReportXlsxMutation.isPending
              ? "Generando Excel..."
              : "Descargar Excel"}
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

const headerLabel = (label: string, className = "") => (
  <span className={`font-semibold text-slate-brand ${className}`}>{label}</span>
);

const nameColumn: ColumnDef<Company> = {
  accessorKey: "name",
  header: ({ column }) => (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="h-auto font-semibold text-slate-brand hover:text-ink hover:bg-transparent transition-colors"
    >
      Nombre
      <ArrowUpDown className="ml-2 h-3 w-3 opacity-60" />
    </Button>
  ),
  cell: ({ row }) => (
    <Link
      href={`/companies/${row.original.id}`}
      className="font-medium text-ink hover:text-electric transition-colors"
    >
      {row.original.name}
    </Link>
  ),
};

const baseColumns: ColumnDef<Company>[] = [
  {
    id: "status",
    header: () => headerLabel("Estado"),
    cell: ({ row }) => <CompanyStatusBadge status={row.original.status} />,
  },
  {
    id: "accountOwner",
    header: () => headerLabel("Responsable de cuenta"),
    cell: ({ row }) => <AccountOwnerControl company={row.original} size="sm" />,
  },
  {
    id: "contacts",
    header: () => headerLabel("Contactos"),
    cell: ({ row }) => {
      const contacts = row.original.contacts;
      if (contacts.length === 0) {
        return <span className="text-muted-brand">—</span>;
      }
      return (
        <span
          className="text-slate-brand"
          title={contacts
            .map((c) => (c.role ? `${c.name} (${c.role})` : c.name))
            .join("\n")}
        >
          <span className="font-semibold text-ink">{contacts.length}</span>{" "}
          <span className="text-xs">
            ·{" "}
            {contacts
              .slice(0, 2)
              .map((c) => c.name.split(" ")[0])
              .join(", ")}
            {contacts.length > 2 && "…"}
          </span>
        </span>
      );
    },
  },
  {
    id: "activeVacancies",
    header: () => headerLabel("Vacantes activas"),
    cell: ({ row }) => (
      <span
        className={
          row.original.activeVacancyCount
            ? "tabular-nums text-ink"
            : "tabular-nums text-muted-brand"
        }
      >
        {row.original.activeVacancyCount}
      </span>
    ),
  },
];

/** Only for users with commercial access. */
const commercialColumns: ColumnDef<Company>[] = [
  {
    id: "openOpportunities",
    header: () => headerLabel("Oportunidades abiertas"),
    cell: ({ row }) => {
      const summary = row.original.commercial;
      if (!summary?.openOpportunityCount) {
        return <span className="text-muted-brand">—</span>;
      }
      return (
        <span className="text-ink">
          <span className="font-semibold">{summary.openOpportunityCount}</span>
          <span className="mx-1.5 text-muted-brand">·</span>
          <span className="tabular-nums text-slate-brand">
            {summary.openOpportunityFee > 0
              ? formatMoney(summary.openOpportunityFee)
              : "Sin estimar"}
          </span>
        </span>
      );
    },
  },
  {
    id: "lastInteraction",
    header: () => headerLabel("Última interacción"),
    cell: ({ row }) => (
      <LastInteractionLabel
        last={row.original.commercial?.lastInteraction ?? null}
      />
    ),
  },
];

const actionsColumn: ColumnDef<Company> = {
  id: "actions",
  cell: ({ row }) => <CellActions company={row.original} />,
};

/** The Companies list columns; commercial-only ones need `commercial`. */
export function companyColumns(commercial: boolean): ColumnDef<Company>[] {
  return [
    nameColumn,
    ...baseColumns,
    ...(commercial ? commercialColumns : []),
    actionsColumn,
  ];
}
