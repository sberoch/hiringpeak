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
import { UserRoleEnum } from "@workspace/shared/types/user";
import { RBACAuthzGuard } from "../auth/rbac-authz-guard";

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
          <RBACAuthzGuard visibleTo={[UserRoleEnum.ADMIN]}>
            <DropdownMenuItem
              className="text-red-600 cursor-pointer"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Eliminar vacante
            </DropdownMenuItem>
          </RBACAuthzGuard>
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

export const columns: ColumnDef<Vacancy>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-gray-700 hover:text-gray-900 hover:bg-transparent dark:text-gray-300 dark:hover:text-gray-100"
        >
          Título
          <ArrowUpDown className="ml-2 h-3 w-3 opacity-60" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const vacancy: Vacancy = row.original;
      return (
        <Link href={`/vacancies/${vacancy.id}`} className="hover:underline">
          {vacancyDisplayLabel(vacancy)}
        </Link>
      );
    },
  },
  {
    accessorKey: "company.name",
    header: "Empresa",
    cell: ({ row }) => {
      const vacancy: Vacancy = row.original;
      return <div>{vacancy.company.name}</div>;
    },
  },
  {
    accessorKey: "status.name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-gray-700 hover:text-gray-900 hover:bg-transparent dark:text-gray-300 dark:hover:text-gray-100"
        >
          Estado
          <ArrowUpDown className="ml-2 h-3 w-3 opacity-60" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const vacancy: Vacancy = row.original;
      const color = stringToColor(vacancy.status.name);
      return (
        <Badge variant="secondary" style={{ backgroundColor: color }}>
          {vacancy.status.name}
        </Badge>
      );
    },
  },
  {
    accessorKey: "candidates",
    header: "Candidatos",
    cell: ({ row }) => {
      const vacancy: Vacancy = row.original;
      const candidatesByStatus: Record<string, number> = {};

      vacancy.candidates.forEach((candidate) => {
        const statusName = candidate.status?.name ?? "-";
        candidatesByStatus[statusName] =
          (candidatesByStatus[statusName] || 0) + 1;
      });

      const totalCandidates = vacancy.candidates.length;

      if (totalCandidates === 0) {
        return <div className="text-zinc-500 text-sm">Sin candidatos</div>;
      }

      return (
        <div className="flex flex-wrap gap-1.5 items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="default">{totalCandidates}</Badge>
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
                      className="text-xs hidden lg:inline-flex"
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
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-gray-700 hover:text-gray-900 hover:bg-transparent dark:text-gray-300 dark:hover:text-gray-100"
        >
          Días de gestión
          <ArrowUpDown className="ml-2 h-3 w-3 opacity-60" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const createdAt = row.original.createdAt;
      const daysDifference = dayjs().diff(dayjs(createdAt), "day");
      return (
        <div>
          {daysDifference} {daysDifference !== 1 ? "días" : "día"}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <CellActions vacancy={row.original} />,
  },
];

export const dashboardColumns: ColumnDef<Vacancy>[] = [
  {
    accessorKey: "title",
    header: "Título",
    cell: ({ row }) => {
      const vacancy: Vacancy = row.original;
      return (
        <Link href={`/vacancies/${vacancy.id}`} className="hover:underline">
          {vacancyDisplayLabel(vacancy)}
        </Link>
      );
    },
  },
  {
    accessorKey: "company.name",
    header: "Empresa",
    cell: ({ row }) => {
      const vacancy: Vacancy = row.original;
      return <div>{vacancy.company.name}</div>;
    },
  },
  {
    accessorKey: "status.name",
    header: "Estado",
    cell: ({ row }) => {
      const vacancy: Vacancy = row.original;
      const color = stringToColor(vacancy.status.name);
      return (
        <Badge variant="secondary" style={{ backgroundColor: color }}>
          {vacancy.status.name}
        </Badge>
      );
    },
  },
  {
    accessorKey: "candidates",
    header: "Candidatos",
    cell: ({ row }) => {
      const vacancy: Vacancy = row.original;
      const candidatesByStatus: Record<string, number> = {};

      vacancy.candidates.forEach((candidate) => {
        const statusName = candidate.status?.name ?? "-";
        candidatesByStatus[statusName] =
          (candidatesByStatus[statusName] || 0) + 1;
      });

      const totalCandidates = vacancy.candidates.length;

      if (totalCandidates === 0) {
        return <div className="text-zinc-500 text-sm">Sin candidatos</div>;
      }

      return (
        <div className="flex flex-wrap gap-1.5 items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="default">{totalCandidates}</Badge>
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
                      className="text-xs hidden lg:inline-flex"
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
    },
  },
  {
    accessorKey: "createdAt",
    header: "Días de gestión",
    cell: ({ row }) => {
      const createdAt = row.original.createdAt;
      const daysDifference = dayjs().diff(dayjs(createdAt), "day");
      return (
        <div>
          {daysDifference} {daysDifference !== 1 ? "días" : "día"}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <CellActions vacancy={row.original} />,
  },
];
