"use client";

import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { PermissionGuard } from "@/components/auth/permission-guard";
import type { ColumnDefinition } from "@/components/column-layout/use-column-layout";
import type { CandidateColumnKey } from "@workspace/shared/lib/column-catalogues";
import { CATALOG_TYPE_COLORS, type CatalogTagType, getInitials } from "@/lib/utils";
import { PermissionCode } from "@workspace/shared/enums";
import type { Candidate } from "@workspace/shared/types/candidate";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";

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

function CatalogBadges({
  items,
  variant,
}: {
  items: { id: number; name: string }[];
  variant: CatalogTagType;
}) {
  if (!items.length) return null;

  if (items.length === 1) {
    return (
      <span
        className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ${CATALOG_TYPE_COLORS[variant]}`}
      >
        {items[0]!.name}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span
        className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ${CATALOG_TYPE_COLORS[variant]}`}
      >
        {items[0]!.name}
      </span>
      <span
        className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ${CATALOG_TYPE_COLORS[variant]}`}
      >
        +{items.length - 1}
      </span>
    </div>
  );
}

/** Header of a column the server can sort by: a button with the sort icon. */
function SortableHeader({
  column,
  label,
}: {
  column: Column<Candidate, unknown>;
  label: string;
}) {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="h-auto font-semibold text-slate-brand hover:text-ink hover:bg-transparent transition-colors"
    >
      {label}
      <ArrowUpDown className="ml-2 h-3 w-3 opacity-60" />
    </Button>
  );
}

/** Header of a column that can't be sorted: plain text, no sort icon. */
function PlainHeader({ label }: { label: string }) {
  return <span className="pl-4 font-semibold text-slate-brand">{label}</span>;
}

function TextList({ items }: { items?: string[] | null }) {
  if (!items?.length) return null;
  return <span className="text-sm text-ink">{items.join(", ")}</span>;
}

const externalUrl = (url: string) =>
  url.startsWith("http://") || url.startsWith("https://")
    ? url
    : `https://${url}`;

/** How the Candidates list draws each column of its Column Catalogue. */
export const candidateColumns: Record<
  CandidateColumnKey,
  ColumnDefinition<ColumnDef<Candidate>>
> = {
  name: {
    label: "Nombre",
    column: {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} label="Nombre" />,
      cell: ({ row }) => {
        const shortDescription = row.original.shortDescription;
        return (
          <div className="flex items-center gap-2.5">
            <Avatar className="size-10 shrink-0">
              {row.original.image && (
                <AvatarImage src={row.original.image} alt={row.original.name} />
              )}
              <AvatarFallback className="bg-brand-border-light text-[10px] font-semibold text-slate-brand">
                {getInitials(row.original.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center">
                <Link
                  href={`/candidates/${row.original.id}`}
                  className="font-medium text-ink hover:text-electric transition-colors truncate"
                >
                  {row.original.name}
                </Link>
                {row.original.blacklist && (
                  <Badge variant="destructive" className="ml-2 rounded-lg text-xs font-semibold shrink-0">
                    BL
                  </Badge>
                )}
                {Boolean(row.original.isInCompanyViaPratt && !row.original.blacklist) && (
                  <Badge variant="secondary" className="ml-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-50 shrink-0">
                    P
                  </Badge>
                )}
                {row.original.linkedin && (
                  <Link
                    href={row.original.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Image
                      src="/images/linkedin.svg"
                      alt="LinkedIn"
                      width={18}
                      height={18}
                      className="inline-block ml-2"
                    />
                  </Link>
                )}
              </div>
              {shortDescription && (
                <p className="text-xs text-slate-brand truncate mt-0.5">
                  {shortDescription.length > 65
                    ? shortDescription.substring(0, 65) + "..."
                    : shortDescription}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
  },
  vacancies: {
    label: "Vacantes",
    column: {
      accessorKey: "vacancies",
      header: () => (
        <span className="pl-4 font-semibold text-slate-brand">Vacante(s)</span>
      ),
      cell: ({ row }) => {
        const vacancies = row.original.vacancies;
        if (!vacancies?.length)
          return <span className="text-muted-brand">Base general</span>;
        if (vacancies.length === 1)
          return (
            <Link
              href={`/vacancies/${vacancies[0]?.id}`}
              className="text-ink hover:text-electric transition-colors"
            >
              {vacancies[0]?.title}
            </Link>
          );
        return (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center rounded-lg bg-electric/5 px-2.5 py-0.5 text-xs font-semibold text-electric cursor-pointer transition-colors hover:bg-electric/10"
              >
                {vacancies.length} vacantes
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-1">
              <div className="flex flex-col">
                {vacancies.map((vacancy) => (
                  <Link
                    key={vacancy.id}
                    href={`/vacancies/${vacancy.id}`}
                    className="rounded-md px-2 py-1.5 text-sm text-ink hover:text-electric hover:bg-brand-border-light/40 transition-colors truncate"
                  >
                    {vacancy.title}
                  </Link>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        );
      },
    },
  },
  tags: {
    label: "Etiquetas",
    column: {
      id: "tags",
      header: () => (
        <span className="pl-4 font-semibold text-slate-brand">Etiquetas</span>
      ),
      meta: { className: "2xl:hidden" },
      cell: ({ row }) => {
        const allTags = [
          ...row.original.seniorities.map((s) => ({ label: s.name, type: "seniority" as CatalogTagType })),
          ...row.original.areas.map((a) => ({ label: a.name, type: "area" as CatalogTagType })),
          ...row.original.industries.map((i) => ({ label: i.name, type: "industry" as CatalogTagType })),
        ];
        if (!allTags.length) return null;
        return (
          <div className="flex items-center gap-1 flex-wrap">
            {allTags.map((tag) => (
              <span
                key={`${tag.type}-${tag.label}`}
                className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ${CATALOG_TYPE_COLORS[tag.type]}`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        );
      },
    },
  },
  seniority: {
    label: "Seniority",
    column: {
      accessorKey: "seniority",
      header: () => (
        <span className="pl-4 font-semibold text-slate-brand">Seniority</span>
      ),
      meta: { className: "hidden 2xl:table-cell" },
      cell: ({ row }) => (
        <CatalogBadges items={row.original.seniorities} variant="seniority" />
      ),
    },
  },
  areas: {
    label: "Áreas",
    column: {
      accessorKey: "areas",
      header: () => (
        <span className="pl-4 font-semibold text-slate-brand">Áreas</span>
      ),
      meta: { className: "hidden 2xl:table-cell" },
      cell: ({ row }) => (
        <CatalogBadges items={row.original.areas} variant="area" />
      ),
    },
  },
  industries: {
    label: "Industrias",
    column: {
      accessorKey: "industries",
      header: () => (
        <span className="pl-4 font-semibold text-slate-brand">Industrias</span>
      ),
      meta: { className: "hidden 2xl:table-cell" },
      cell: ({ row }) => (
        <CatalogBadges items={row.original.industries} variant="industry" />
      ),
    },
  },
  stars: {
    label: "Estrellas",
    column: {
      accessorKey: "stars",
      header: ({ column }) => (
        <SortableHeader column={column} label="Estrellas" />
      ),
      cell: ({ row }) => <CandidateStars stars={+row.original.stars} size="sm" />,
    },
  },
  email: {
    label: "Email",
    column: {
      accessorKey: "email",
      header: ({ column }) => <SortableHeader column={column} label="Email" />,
      cell: ({ row }) =>
        row.original.email ? (
          <a
            href={`mailto:${row.original.email}`}
            className="text-sm text-ink hover:text-electric transition-colors"
          >
            {row.original.email}
          </a>
        ) : null,
    },
  },
  phone: {
    label: "Teléfono",
    column: {
      id: "phone",
      header: () => <PlainHeader label="Teléfono" />,
      cell: ({ row }) => (
        <span className="text-sm text-ink whitespace-nowrap">
          {row.original.phone}
        </span>
      ),
    },
  },
  linkedin: {
    label: "LinkedIn",
    column: {
      id: "linkedin",
      header: () => <PlainHeader label="LinkedIn" />,
      cell: ({ row }) =>
        row.original.linkedin ? (
          <Link
            href={externalUrl(row.original.linkedin)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ink hover:text-electric transition-colors"
          >
            Ver perfil
          </Link>
        ) : null,
    },
  },
  source: {
    label: "Origen",
    column: {
      id: "source",
      header: () => <PlainHeader label="Origen" />,
      cell: ({ row }) => (
        <span className="text-sm text-ink">{row.original.source?.name}</span>
      ),
    },
  },
  countries: {
    label: "Países",
    column: {
      id: "countries",
      header: () => <PlainHeader label="Países" />,
      cell: ({ row }) => <TextList items={row.original.countries} />,
    },
  },
  languages: {
    label: "Idiomas",
    column: {
      id: "languages",
      header: () => <PlainHeader label="Idiomas" />,
      cell: ({ row }) => <TextList items={row.original.languages} />,
    },
  },
  createdAt: {
    label: "Fecha de alta",
    column: {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column} label="Fecha de alta" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-slate-brand whitespace-nowrap">
          {new Date(row.original.createdAt).toLocaleDateString("es-AR")}
        </span>
      ),
    },
  },
  actions: {
    label: "Acciones",
    column: {
      id: "actions",
      cell: ({ row }) => <CellActions candidate={row.original} />,
    },
  },
};
