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
          className="h-auto font-semibold text-slate-brand hover:text-ink hover:bg-transparent transition-colors"
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
          className="font-medium text-ink hover:text-electric transition-colors"
        >
          {row.original.name}
        </Link>
        {row.original.blacklist && (
          <Badge variant="destructive" className="ml-2 rounded-lg text-xs font-semibold">
            BL
          </Badge>
        )}
        {Boolean(row.original.isInCompanyViaPratt && !row.original.blacklist) && (
          <Badge variant="secondary" className="ml-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
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
    header: () => (
      <span className="pl-4 font-semibold text-slate-brand">Descripción</span>
    ),
    cell: ({ row }) => {
      const shortDescription = row.original.shortDescription;
      if (!shortDescription) return <span className="text-muted-brand">Sin descripción</span>;
      return (
        <span className="text-slate-brand">
          {shortDescription.length > 100
            ? shortDescription.substring(0, 100) + "..."
            : shortDescription}
        </span>
      );
    },
  },
  {
    accessorKey: "vacancies",
    header: () => (
      <span className="pl-4 font-semibold text-slate-brand">Vacante(s)</span>
    ),
    cell: ({ row }) => {
      const vacancies = row.original.vacancies;
      if (!vacancies?.length)
        return <span className="text-muted-brand">Base general</span>;
      if (vacancies?.length === 1)
        return <span className="text-ink">{vacancies[0]?.title}</span>;
      return (
        <span className="inline-flex items-center rounded-lg bg-electric/5 px-2.5 py-0.5 text-xs font-semibold text-electric">
          {vacancies.length} vacantes
        </span>
      );
    },
  },
  {
    accessorKey: "seniority",
    header: () => (
      <span className="pl-4 font-semibold text-slate-brand">Seniority</span>
    ),
    cell: ({ row }) => (
      <span className="text-slate-brand">
        {row.original.seniorities.length > 1
          ? row.original.seniorities.length + " Seniorities"
          : row.original.seniorities[0]?.name || ""}
      </span>
    ),
  },
  {
    accessorKey: "areas",
    header: () => (
      <span className="pl-4 font-semibold text-slate-brand">Áreas</span>
    ),
    cell: ({ row }) => (
      <span className="text-slate-brand">
        {row.original.areas.length > 1
          ? row.original.areas.length + " Áreas"
          : row.original.areas[0]?.name || ""}
      </span>
    ),
  },
  {
    accessorKey: "industries",
    header: () => (
      <span className="pl-4 font-semibold text-slate-brand">Industrias</span>
    ),
    cell: ({ row }) => (
      <span className="text-slate-brand">
        {row.original.industries.length > 1
          ? row.original.industries.length + " Industrias"
          : row.original.industries[0]?.name || ""}
      </span>
    ),
  },
  {
    accessorKey: "stars",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto font-semibold text-slate-brand hover:text-ink hover:bg-transparent transition-colors"
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
