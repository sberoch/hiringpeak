"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, Plus, UserX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { cn } from "@workspace/ui/lib/utils";
import { PermissionCode } from "@workspace/shared/enums";
import { ContactAvatar } from "@/components/contacts/contact-avatar-and-links";
import { usePermissions } from "@/contexts/permission-context";
import { COMPANIES_API_KEY, getCompanyById } from "@/lib/api/company";
import { createContact } from "@/lib/api/contact";

interface VacancyContactPickerProps {
  companyId: number | null;
  value: number | null;
  onChange: (contactId: number | null) => void;
}

const CARD =
  "flex flex-col gap-2 rounded-xl border bg-surface p-3 text-left transition-all";
const CARD_ON = "border-electric shadow-[0_0_0_3px_rgba(0,102,255,0.10)]";
const CARD_OFF =
  "border-brand-border hover:border-electric/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]";

function Radio({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
        on ? "border-electric" : "border-brand-border",
      )}
    >
      {on && <span className="h-2 w-2 rounded-full bg-electric" />}
    </span>
  );
}

/**
 * Vacancy Contact picker: once a Company is chosen, its current Contacts as
 * cards plus "Ninguno". "Agregar contacto" only with COMPANY_MANAGE.
 */
export function VacancyContactPicker({
  companyId,
  value,
  onChange,
}: VacancyContactPickerProps) {
  const { hasPermission } = usePermissions();
  const canAdd = hasPermission(PermissionCode.COMPANY_MANAGE);
  const [adding, setAdding] = useState(false);

  const { data: company, isLoading } = useQuery({
    queryKey: [COMPANIES_API_KEY, String(companyId)],
    queryFn: () => getCompanyById(String(companyId)),
    enabled: companyId != null,
  });
  const contacts = company?.contacts ?? [];

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-ink">
        Contacto de la vacante
        <span className="ml-1 font-normal text-muted-brand">(opcional)</span>
      </Label>
      <p className="text-xs leading-relaxed text-muted-brand">
        ¿Con quién del cliente se lleva esta búsqueda? Puede ser distinto en
        cada vacante.
      </p>

      {companyId == null ? (
        <div className="rounded-xl border border-dashed border-brand-border px-4 py-6 text-center text-sm text-muted-brand">
          Elegí una empresa para ver sus contactos.
        </div>
      ) : isLoading ? (
        <div className="h-28 animate-pulse rounded-xl bg-brand-border-light" />
      ) : (
        <div
          role="radiogroup"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
        >
          {contacts.map((contact) => {
            const on = value === contact.id;
            return (
              <button
                key={contact.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange(contact.id)}
                className={cn(CARD, on ? CARD_ON : CARD_OFF)}
              >
                <div className="flex items-start gap-2.5">
                  <ContactAvatar
                    name={contact.name}
                    className={
                      on
                        ? "bg-electric/10 text-electric ring-electric/30"
                        : undefined
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {contact.name}
                    </p>
                    <p className="truncate text-xs text-slate-brand">
                      {contact.role || "Sin cargo"}
                    </p>
                  </div>
                  <Radio on={on} />
                </div>
                <div className="space-y-0.5 text-[11px] text-slate-brand">
                  <p className="flex items-center gap-1 truncate">
                    <Mail className="h-3 w-3 shrink-0" />
                    {contact.email ?? (
                      <span className="text-muted-brand">Sin email</span>
                    )}
                  </p>
                  <p className="flex items-center gap-1 truncate">
                    <Phone className="h-3 w-3 shrink-0" />
                    {contact.phone ?? (
                      <span className="text-muted-brand">Sin teléfono</span>
                    )}
                  </p>
                </div>
              </button>
            );
          })}

          <button
            type="button"
            role="radio"
            aria-checked={value == null}
            onClick={() => onChange(null)}
            className={cn(
              "flex min-h-[112px] flex-col justify-between rounded-xl border p-3 text-left transition-all",
              value == null
                ? "border-electric bg-surface shadow-[0_0_0_3px_rgba(0,102,255,0.10)]"
                : "border-brand-border bg-canvas/60 hover:border-electric/40",
            )}
          >
            <div className="flex items-start gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-border-light text-muted-brand">
                <UserX className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">Ninguno</p>
                <p className="text-xs text-slate-brand">
                  Sin contacto por ahora
                </p>
              </div>
              <Radio on={value == null} />
            </div>
          </button>

          {canAdd && !adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex min-h-[112px] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-border p-3 text-sm font-medium text-electric transition-colors hover:border-electric hover:bg-electric/[0.03]"
            >
              <Plus className="h-4 w-4" />
              Agregar contacto
            </button>
          )}

          {canAdd && adding && (
            <div className="col-span-full rounded-xl border border-electric/40 bg-electric/[0.03] p-4">
              <NewContactInline
                companyId={companyId}
                companyName={company?.name ?? ""}
                onCancel={() => setAdding(false)}
                onCreated={(id) => {
                  onChange(id);
                  setAdding(false);
                }}
              />
            </div>
          )}
        </div>
      )}

      {companyId != null && !isLoading && contacts.length === 0 && (
        <p className="text-xs text-muted-brand">
          {company?.name} no tiene contactos cargados todavía.
        </p>
      )}
      {companyId != null && !canAdd && (
        <p className="text-xs text-muted-brand">
          ¿Falta alguien? Los contactos los carga quien gestiona la empresa.
        </p>
      )}
    </div>
  );
}

/**
 * Mini form to create a Contact on the Company. A div, not a <form>: it
 * renders inside the vacancy form.
 */
function NewContactInline({
  companyId,
  companyName,
  onCreated,
  onCancel,
}: {
  companyId: number;
  companyName: string;
  onCreated: (id: number) => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      createContact({
        companyId,
        name: name.trim(),
        role: role.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
      }),
    onSuccess: async (contact) => {
      toast.success(`Contacto «${contact.name}» creado en ${companyName}`);
      await queryClient.invalidateQueries({ queryKey: [COMPANIES_API_KEY] });
      onCreated(contact.id);
    },
    onError: () => {
      toast.error("No se pudo crear el contacto. Revisá el email.");
    },
  });

  const ok = name.trim().length > 0 && !isPending;
  const submit = () => {
    if (ok) mutate();
  };

  return (
    <div
      className="space-y-3"
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.stopPropagation();
          submit();
        }
      }}
    >
      <p className="text-xs text-slate-brand">
        Nuevo contacto en{" "}
        <span className="font-semibold text-ink">{companyName}</span>
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Nombre</Label>
          <Input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nombre y apellido"
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Cargo</Label>
          <Input
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="Ej. CFO"
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="opcional"
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Teléfono</Label>
          <Input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="opcional"
            className="h-8"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!ok}
          onClick={submit}
          className="bg-electric text-white hover:bg-electric-light"
        >
          {isPending ? "Creando..." : "Crear y elegir"}
        </Button>
      </div>
    </div>
  );
}
