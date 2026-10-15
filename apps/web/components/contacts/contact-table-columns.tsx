"use client";

import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { canManageContacts } from "@workspace/shared/lib/contact-access";
import type { NetworkContact } from "@workspace/shared/types/contact";

import { usePermissions } from "@/contexts/permission-context";
import { ContactAvatar } from "./contact-atoms";
import { ContactCaptureSheet } from "./contact-capture-sheet";
import { useCurrentUserId } from "./contact-lookups";
import { DeleteContactDialog } from "./delete-contact-dialog";

export const linkedinUrl = (url: string) =>
  `https://${url.replace(/^https?:\/\//, "")}`;

function SortHeader({
  column,
  label,
}: {
  column: Column<NetworkContact, unknown>;
  label: string;
}) {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="h-auto font-semibold text-slate-brand transition-colors hover:bg-transparent hover:text-ink"
    >
      {label}
      <ArrowUpDown className="ml-2 h-3 w-3 opacity-60" />
    </Button>
  );
}

const PlainHeader = ({ label }: { label: string }) => (
  <span className="font-semibold text-slate-brand">{label}</span>
);

function CellActions({ contact }: { contact: NetworkContact }) {
  const router = useRouter();
  const { permissionCodes } = usePermissions();
  const canManage = canManageContacts(permissionCodes);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 cursor-pointer p-0">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push(`/contacts/${contact.id}`)}
          >
            Ver contacto
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            disabled={!contact.email}
            onClick={() => {
              if (!contact.email) return;
              void navigator.clipboard?.writeText(contact.email);
              toast.success("Email copiado", { description: contact.email });
            }}
          >
            Copiar email
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            disabled={!contact.linkedin}
            onClick={() =>
              contact.linkedin &&
              window.open(linkedinUrl(contact.linkedin), "_blank", "noopener")
            }
          >
            Abrir LinkedIn
          </DropdownMenuItem>
          {canManage && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => setEditOpen(true)}
              >
                Editar contacto
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-red-600"
                onClick={() => setDeleteOpen(true)}
              >
                Eliminar contacto
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {canManage && editOpen && (
        <ContactCaptureSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          contact={contact}
        />
      )}
      <DeleteContactDialog
        contact={deleteOpen ? contact : null}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}

function OwnerCell({ contact }: { contact: NetworkContact }) {
  const me = useCurrentUserId();
  if (!contact.owner)
    return <span className="text-muted-brand">Sin responsable</span>;
  return (
    <span className="inline-flex items-center gap-2 text-ink">
      <ContactAvatar
        name={contact.owner.name}
        className="h-6 w-6 text-[10px]"
      />
      {contact.owner.id === me ? "Vos" : contact.owner.name}
    </span>
  );
}

export const columns: ColumnDef<NetworkContact>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => <SortHeader column={column} label="Contacto" />,
    cell: ({ row }) => {
      const contact = row.original;
      return (
        <div className="flex items-center gap-2.5">
          <ContactAvatar name={contact.name} className="h-10 w-10" />
          <div className="min-w-0">
            <div className="flex items-center">
              <Link
                href={`/contacts/${contact.id}`}
                className="truncate font-medium text-ink transition-colors hover:text-electric"
              >
                {contact.name}
              </Link>
              {contact.linkedin && (
                <Link
                  href={linkedinUrl(contact.linkedin)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Image
                    src="/images/linkedin.svg"
                    alt="LinkedIn"
                    width={18}
                    height={18}
                    className="ml-2 inline-block"
                  />
                </Link>
              )}
            </div>
            {contact.role && (
              <p className="mt-0.5 max-w-[220px] truncate text-xs text-slate-brand">
                {contact.role}
              </p>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: "company",
    header: () => <PlainHeader label="Empresa" />,
    cell: ({ row }) => {
      const company = row.original.company;
      if (!company)
        return <span className="text-muted-brand">Sin empresa</span>;
      return (
        <Link
          href={`/companies/${company.id}`}
          className="text-ink transition-colors hover:text-electric"
        >
          {company.name}
        </Link>
      );
    },
  },
  {
    id: "source",
    header: () => <PlainHeader label="Origen" />,
    cell: ({ row }) => <SourceBadge source={row.original.source} />,
  },
  {
    id: "owner",
    header: () => <PlainHeader label="Responsable" />,
    cell: ({ row }) => <OwnerCell contact={row.original} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <CellActions contact={row.original} />,
  },
];

export function SourceBadge({
  source,
}: {
  source: { id: number; name: string } | null;
}) {
  if (!source) return <span className="text-muted-brand">Sin origen</span>;
  return (
    <Badge
      variant="outline"
      className="rounded-full border-electric/20 bg-electric/[0.06] font-medium text-electric"
    >
      {source.name}
    </Badge>
  );
}
