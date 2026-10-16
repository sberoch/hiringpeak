"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@workspace/ui/components/button";
import { DataTable } from "@workspace/ui/components/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { canManageContacts } from "@workspace/shared/lib/contact-access";
import type { Company } from "@workspace/shared/types/company";
import type { ContactView } from "@workspace/shared/types/contact";
import {
  ContactAvatar,
  CopyChip,
} from "@/components/contacts/contact-avatar-and-links";
import { linkedinUrl } from "@/components/contacts/contact-table-columns";
import { ContactSheet } from "@/components/contacts/contact-sheet";
import { DeleteContactDialog } from "@/components/contacts/delete-contact-dialog";
import { useCommercialAccess } from "@/components/opportunities/commercial-access";
import { usePermissions } from "@/contexts/permission-context";

const PlainHeader = ({ label }: { label: string }) => (
  <span className="font-semibold text-slate-brand">{label}</span>
);

function contactColumns({
  linkToContact,
  onEdit,
  onDelete,
}: {
  /** The Contact page is commercial-only. */
  linkToContact: boolean;
  /** Without these, the row has no actions menu. */
  onEdit?: (contact: ContactView) => void;
  onDelete?: (contact: ContactView) => void;
}): ColumnDef<ContactView>[] {
  const columns: ColumnDef<ContactView>[] = [
    {
      id: "name",
      header: () => <PlainHeader label="Contacto" />,
      cell: ({ row }) => {
        const contact = row.original;
        return (
          <div className="flex items-center gap-2.5">
            <ContactAvatar name={contact.name} className="h-10 w-10" />
            <div className="min-w-0">
              <div className="flex items-center">
                {linkToContact ? (
                  <Link
                    href={`/contacts/${contact.id}`}
                    className="truncate font-medium text-ink transition-colors hover:text-electric"
                  >
                    {contact.name}
                  </Link>
                ) : (
                  <span className="truncate font-medium text-ink">
                    {contact.name}
                  </span>
                )}
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
              <p className="mt-0.5 max-w-[220px] truncate text-xs text-slate-brand">
                {contact.role || "Sin cargo"}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: "email",
      header: () => <PlainHeader label="Email" />,
      cell: ({ row }) => (
        <div className="max-w-[240px]">
          <CopyChip kind="email" value={row.original.email} />
        </div>
      ),
    },
    {
      id: "phone",
      header: () => <PlainHeader label="Teléfono" />,
      cell: ({ row }) => <CopyChip kind="phone" value={row.original.phone} />,
    },
  ];
  if (onEdit && onDelete) {
    columns.push({
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 cursor-pointer p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => onEdit(row.original)}
              >
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600"
                onClick={() => onDelete(row.original)}
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    });
  }
  return columns;
}

/**
 * The Company's current Contacts. Managed with COMPANY_MANAGE or CRM_MANAGE;
 * everyone else (recruiters included) sees them read-only. The API already
 * trims the fields a recruiter may see.
 */
export function CompanyContactsTab({ company }: { company: Company }) {
  const { permissionCodes } = usePermissions();
  const canManage = canManageContacts(permissionCodes);
  const [sheet, setSheet] = useState<{ contact: ContactView | null } | null>(
    null,
  );
  const [toDelete, setToDelete] = useState<ContactView | null>(null);
  const { canRead: commercial } = useCommercialAccess();
  const columns = useMemo(
    () =>
      contactColumns({
        linkToContact: commercial,
        ...(canManage && {
          onEdit: (contact: ContactView) => setSheet({ contact }),
          onDelete: setToDelete,
        }),
      }),
    [commercial, canManage],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-brand">
          Quienes trabajan hoy en {company.name}. Hacé clic en un email o
          teléfono para copiarlo.
        </p>
        {canManage && (
          <Button
            size="sm"
            className="bg-electric text-white hover:bg-electric-light"
            onClick={() => setSheet({ contact: null })}
          >
            <Plus className="h-4 w-4" /> Agregar contacto
          </Button>
        )}
      </div>

      <DataTable columns={columns} data={company.contacts} hidePagination />

      {sheet && (
        <ContactSheet
          key={sheet.contact?.id ?? "new"}
          isOpen
          onClose={() => setSheet(null)}
          companyId={company.id}
          companyName={company.name}
          contact={sheet.contact}
        />
      )}
      <DeleteContactDialog
        contact={toDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
