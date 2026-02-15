"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { PermissionCode } from "@workspace/shared/enums";
import type { Candidate } from "@workspace/shared/types/candidate";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";

import { CandidateStars } from "./candidate-stars";
import { DeleteCandidateDialog } from "./delete-candidate-dialog";

interface CellActionsProps {
  candidate: Candidate;
}

const CellActions = ({ candidate }: CellActionsProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
          <DropdownMenuItem className="cursor-pointer">
            <Link href={`/candidates/${candidate.id}/edit`}>
              Editar candidato
            </Link>
          </DropdownMenuItem>
          <PermissionGuard permissions={[PermissionCode.CANDIDATE_MANAGE]}>
            <DropdownMenuItem
              className="text-red-600 cursor-pointer"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Eliminar candidato
            </DropdownMenuItem>
          </PermissionGuard>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteCandidateDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        candidate={candidate}
      />
    </>
  );
};

export const columns: ColumnDef<Candidate>[] = [
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
    cell: ({ row }) => (
      <div className="flex items-center">
        <Link
          href={`/candidates/${row.original.id}`}
          className="hover:underline"
        >
          {row.original.name}
        </Link>
        {row.original.blacklist && (
          <Badge variant="destructive" className="ml-2">
            BL
          </Badge>
        )}
        {Boolean(row.original.isInCompanyViaPratt && !row.original.blacklist) && (
          <Badge variant="secondary" className="ml-2 text-white bg-green-500/90">
            P
          </Badge>
        )}
        {row.original.linkedin && (
          <Link
            href={row.original.linkedin}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/images/linkedin.svg"
              alt="LinkedIn"
              width={20}
              height={20}
              className="inline-block ml-2"
            />
          </Link>
        )}
      </div>
    ),
  },
  {
    accessorKey: "shortDescription",
    header: "Descripción",
    cell: ({ row }) => {
      const shortDescription = row.original.shortDescription;
      if (!shortDescription) return "Sin descripción";
      return shortDescription.length > 100
        ? shortDescription.substring(0, 100) + "..."
        : shortDescription;
    },
  },
  {
    accessorKey: "vacancies",
    header: "Vacante(s)",
    cell: ({ row }) => {
      const vacancies = row.original.vacancies;
      if (!vacancies?.length) return "Base general";
      if (vacancies?.length === 1) return vacancies[0]?.title;
      return `${vacancies.length} vacantes`;
    },
  },
  {
    accessorKey: "seniority",
    header: "Seniority",
    cell: ({ row }) =>
      row.original.seniorities.length > 1
        ? row.original.seniorities.length + " Seniorities"
        : row.original.seniorities[0]?.name || "",
  },
  {
    accessorKey: "areas",
    header: "Áreas",
    cell: ({ row }) =>
      row.original.areas.length > 1
        ? row.original.areas.length + " Áreas"
        : row.original.areas[0]?.name || "",
  },
  {
    accessorKey: "industries",
    header: "Industrias",
    cell: ({ row }) =>
      row.original.industries.length > 1
        ? row.original.industries.length + " Industrias"
        : row.original.industries[0]?.name || "",
  },
  {
    accessorKey: "stars",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold text-gray-700 hover:text-gray-900 hover:bg-transparent dark:text-gray-300 dark:hover:text-gray-100"
        >
          Estrellas
          <ArrowUpDown className="ml-2 h-3 w-3 opacity-60" />
        </Button>
      );
    },
    cell: ({ row }) => <CandidateStars stars={+row.original.stars} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <CellActions candidate={row.original} />,
  },
];
