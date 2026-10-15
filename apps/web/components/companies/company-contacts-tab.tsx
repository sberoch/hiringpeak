"use client";

import { MoreHorizontal, Plus, Users } from "lucide-react";
import { useState } from "react";

import { Button } from "@workspace/ui/components/button";
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
  LinkedinLink,
} from "@/components/contacts/contact-avatar-and-links";
import { ContactSheet } from "@/components/contacts/contact-sheet";
import { DeleteContactDialog } from "@/components/contacts/delete-contact-dialog";
import { usePermissions } from "@/contexts/permission-context";

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

      <div className="overflow-hidden rounded-2xl border border-brand-border bg-surface">
        {company.contacts.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <Users className="mx-auto mb-2 h-6 w-6 text-muted-brand" />
            <p className="text-sm font-medium text-ink">
              Nadie cargado trabaja hoy en esta empresa.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left text-xs font-semibold text-slate-brand">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Teléfono</th>
                  {canManage && <th className="w-10 px-2 py-3" />}
                </tr>
              </thead>
              <tbody>
                {company.contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="border-b border-brand-border-light last:border-0 hover:bg-canvas/60"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <ContactAvatar name={contact.name} />
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">
                            {contact.name}
                          </p>
                          <p className="flex items-center gap-2 text-xs text-muted-brand">
                            {contact.role || "Sin cargo"}
                            <LinkedinLink url={contact.linkedin} />
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[240px] px-4 py-3.5">
                      <CopyChip kind="email" value={contact.email} />
                    </td>
                    <td className="px-4 py-3.5">
                      <CopyChip kind="phone" value={contact.phone} />
                    </td>
                    {canManage && (
                      <td className="px-2 py-3.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Acciones</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => setSheet({ contact })}
                            >
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600"
                              onClick={() => setToDelete(contact)}
                            >
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
