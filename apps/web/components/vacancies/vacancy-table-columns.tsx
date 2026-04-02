"use client";

import { useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Badge } from "@workspace/ui/components/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { DeleteVacancyDialog } from "./delete-vacancy-dialog";
import { EditVacancySheet } from "./edit-vacancy-sheet";
import { DuplicateVacancySheet } from "./duplicate-vacancy-sheet";
import { stringToColor, vacancyDisplayLabel } from "@/lib/utils";
import type { Vacancy } from "@workspace/shared/types/vacancy";
import { PermissionGuard } from "../auth/permission-guard";
import { PermissionCode } from "@workspace/shared/enums";

interface CellActionsProps {
  vacancy: Vacancy;
}

const CellActions = ({ vacancy }: CellActionsProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDuplicateSheetOpen, setIsDuplicateSheetOpen] = useState(false);

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
            Editar vacante
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setIsDuplicateSheetOpen(true)}
          >
            Duplicar vacante
          </DropdownMenuItem>
          <PermissionGuard permissions={[PermissionCode.VACANCY_MANAGE]}>
            <DropdownMenuItem
              className="text-red-600 cursor-pointer"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Eliminar vacante
            </DropdownMenuItem>
          </PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>
      {isDeleteDialogOpen && (
        <DeleteVacancyDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          vacancy={vacancy}
        />
      )}
      {isEditSheetOpen && (
        <EditVacancySheet
          isOpen={isEditSheetOpen}
          onClose={() => setIsEditSheetOpen(false)}
          vacancy={vacancy}
        />
      )}
      <DuplicateVacancySheet
        isOpen={isDuplicateSheetOpen}
        onClose={() => setIsDuplicateSheetOpen(false)}
        vacancy={vacancy}
      />
    </>
  );
};

const CandidatesCell = ({ vacancy }: { vacancy: Vacancy }) => {
  const candidatesByStatus: Record<string, number> = {};

  vacancy.candidates.forEach((candidate) => {
    const statusName = candidate.status?.name ?? "-";
    candidatesByStatus[statusName] =
      (candidatesByStatus[statusName] || 0) + 1;
  });

  const totalCandidates = vacancy.candidates.length;

  if (totalCandidates === 0) {
    return <div className="text-muted-brand text-sm">Sin candidatos</div>;
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center rounded-lg bg-electric/5 px-2.5 py-0.5 text-xs font-semibold text-electric">
              {totalCandidates}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total de candidatos</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {Object.entries(candidatesByStatus).map(([status, count]) => {
        const color = stringToColor(status);
        return (
          <TooltipProvider key={status}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="secondary"
                  className="text-xs rounded-lg font-semibold hidden lg:inline-flex"
                  style={{ backgroundColor: color }}
                >
                  {count}{" "}
                  {status.startsWith("Entrevista")
                    ? `E. ${status.split(" ")[1]}`
                    : status}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {count} candidatos en estado &quot;{status}&quot;
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};

const StatusCell = ({ vacancy }: { vacancy: Vacancy }) => {
  const color = stringToColor(vacancy.status.name);
  return (
    <Badge variant="secondary" className="rounded-lg text-xs font-semibold" style={{ backgroundColor: color }}>
      {vacancy.status.name}
    </Badge>
  );
};

const DaysCell = ({ createdAt }: { createdAt: string }) => {
  const daysDifference = dayjs().diff(dayjs(createdAt), "day");
  return (
    <div className="text-slate-brand">
      {daysDifference} {daysDifference !== 1 ? "días" : "día"}
    </div>
  );
};

export const columns: ColumnDef<Vacancy>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-slate-brand hover:text-ink hover:bg-transparent transition-colors"
        >
          Título
          <ArrowUpDown className="ml-2 h-3 w-3 opacity-60" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const vacancy: Vacancy = row.original;
      return (
        <Link href={`/vacancies/${vacancy.id}`} className="font-medium text-ink hover:text-electric transition-colors">
          {vacancyDisplayLabel(vacancy)}
        </Link>
      );
    },
  },
  {
    accessorKey: "company.name",
    header: () => (
      <span className="pl-4 font-semibold text-slate-brand">Empresa</span>
    ),
    cell: ({ row }) => {
      const vacancy: Vacancy = row.original;
      return <div className="text-ink">{vacancy.company.name}</div>;
    },
  },
  {
    accessorKey: "status.name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-slate-brand hover:text-ink hover:bg-transparent transition-colors"
        >
          Estado
          <ArrowUpDown className="ml-2 h-3 w-3 opacity-60" />
        </Button>
      );
    },
    cell: ({ row }) => <StatusCell vacancy={row.original} />,
  },
  {
    accessorKey: "candidates",
    header: () => (
      <span className="pl-4 font-semibold text-slate-brand">Candidatos</span>
    ),
    cell: ({ row }) => <CandidatesCell vacancy={row.original} />,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-slate-brand hover:text-ink hover:bg-transparent transition-colors"
        >
          Días de gestión
          <ArrowUpDown className="ml-2 h-3 w-3 opacity-60" />
        </Button>
      );
    },
    cell: ({ row }) => <DaysCell createdAt={row.original.createdAt} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <CellActions vacancy={row.original} />,
  },
];

export const dashboardColumns: ColumnDef<Vacancy>[] = [
  {
    accessorKey: "title",
    header: () => (
      <span className="font-semibold text-slate-brand">Título</span>
    ),
    cell: ({ row }) => {
      const vacancy: Vacancy = row.original;
      return (
        <Link href={`/vacancies/${vacancy.id}`} className="font-medium text-ink hover:text-electric transition-colors">
          {vacancyDisplayLabel(vacancy)}
        </Link>
      );
    },
  },
  {
    accessorKey: "company.name",
    header: () => (
      <span className="pl-4 font-semibold text-slate-brand">Empresa</span>
    ),
    cell: ({ row }) => {
      const vacancy: Vacancy = row.original;
      return <div className="text-ink">{vacancy.company.name}</div>;
    },
  },
  {
    accessorKey: "status.name",
    header: () => (
      <span className="pl-4 font-semibold text-slate-brand">Estado</span>
    ),
    cell: ({ row }) => <StatusCell vacancy={row.original} />,
  },
  {
    accessorKey: "candidates",
    header: () => (
      <span className="pl-4 font-semibold text-slate-brand">Candidatos</span>
    ),
    cell: ({ row }) => <CandidatesCell vacancy={row.original} />,
  },
  {
    accessorKey: "createdAt",
    header: () => (
      <span className="pl-4 font-semibold text-slate-brand">Días de gestión</span>
    ),
    cell: ({ row }) => <DaysCell createdAt={row.original.createdAt} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <CellActions vacancy={row.original} />,
  },
];
