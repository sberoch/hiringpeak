"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import type { CompanyColumnKey } from "@workspace/shared/lib/column-catalogues";
import type { Company } from "@workspace/shared/types/company";
import {
  CreatedDateCell,
  PlainHeader,
  SortableHeader,
} from "@/components/column-layout/table-cells";
import type { ColumnDefinition } from "@/components/column-layout/use-column-layout";
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
import { LastInteractionLabel } from "@/components/interactions/interaction-format";
import { AccountOwnerControl } from "@/components/companies/account-owner-control";
import { CompanyStatusBadge } from "@/components/companies/company-status-badge";

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

const count = (value: number) => (
  <span
    className={
      value ? "tabular-nums text-ink" : "tabular-nums text-muted-brand"
    }
  >
    {value}
  </span>
);

/** How the Companies list draws each column of its Column Catalogue. */
export const companyColumns: Record<
  CompanyColumnKey,
  ColumnDefinition<ColumnDef<Company>>
> = {
  name: {
    label: "Nombre",
    column: {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} label="Nombre" />,
      cell: ({ row }) => (
        <Link
          href={`/companies/${row.original.id}`}
          className="font-medium text-ink hover:text-electric transition-colors"
        >
          {row.original.name}
        </Link>
      ),
    },
  },
  status: {
    label: "Estado",
    column: {
      id: "status",
      header: () => <PlainHeader label="Estado" />,
      cell: ({ row }) => <CompanyStatusBadge status={row.original.status} />,
    },
  },
  accountOwner: {
    label: "Responsable de cuenta",
    column: {
      id: "accountOwner",
      header: () => <PlainHeader label="Responsable de cuenta" />,
      cell: ({ row }) => (
        <AccountOwnerControl company={row.original} size="sm" />
      ),
    },
  },
  contacts: {
    label: "Contactos",
    column: {
      id: "contacts",
      header: () => <PlainHeader label="Contactos" />,
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
  },
  activeVacancies: {
    label: "Vacantes activas",
    column: {
      id: "activeVacancies",
      header: () => <PlainHeader label="Vacantes activas" />,
      cell: ({ row }) => count(row.original.activeVacancyCount),
    },
  },
  openOpportunities: {
    label: "Oportunidades abiertas",
    column: {
      id: "openOpportunities",
      header: () => <PlainHeader label="Oportunidades abiertas" />,
      cell: ({ row }) => {
        const summary = row.original.commercial;
        if (!summary?.openOpportunityCount) {
          return <span className="text-muted-brand">—</span>;
        }
        return (
          <span className="text-ink">
            <span className="font-semibold">
              {summary.openOpportunityCount}
            </span>
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
  },
  lastInteraction: {
    label: "Última interacción",
    column: {
      id: "lastInteraction",
      header: () => <PlainHeader label="Última interacción" />,
      cell: ({ row }) => (
        <LastInteractionLabel
          last={row.original.commercial?.lastInteraction ?? null}
        />
      ),
    },
  },
  totalVacancies: {
    label: "Vacantes totales",
    column: {
      id: "totalVacancies",
      header: () => <PlainHeader label="Vacantes totales" />,
      cell: ({ row }) => count(row.original.vacancyCount),
    },
  },
  openOpportunityFee: {
    label: "Fee estimado abierto",
    column: {
      id: "openOpportunityFee",
      header: () => <PlainHeader label="Fee estimado abierto" />,
      cell: ({ row }) => {
        const fee = row.original.commercial?.openOpportunityFee ?? 0;
        if (fee <= 0) return <span className="text-muted-brand">—</span>;
        return (
          <span className="tabular-nums text-ink">{formatMoney(fee)}</span>
        );
      },
    },
  },
  createdAt: {
    label: "Fecha de alta",
    column: {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column} label="Fecha de alta" />
      ),
      cell: ({ row }) => <CreatedDateCell createdAt={row.original.createdAt} />,
    },
  },
  actions: {
    label: "Acciones",
    column: {
      id: "actions",
      cell: ({ row }) => <CellActions company={row.original} />,
    },
  },
};
