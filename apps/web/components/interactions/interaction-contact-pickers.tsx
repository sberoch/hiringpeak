"use client";

import { useQuery } from "@tanstack/react-query";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";

import { CONTACT_API_KEY, getContacts } from "@/lib/api/contact";

export type ContactOption = { id: number; name: string; hint?: string };

export function ContactChips({
  options,
  selected,
  onToggle,
  empty = "La empresa no tiene contactos cargados.",
}: {
  options: ContactOption[];
  selected: number[];
  onToggle: (id: number) => void;
  empty?: string;
}) {
  if (options.length === 0) {
    return <span className="text-xs text-muted-brand">{empty}</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((c) => {
        const on = selected.includes(c.id);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onToggle(c.id)}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 transition-colors",
              on
                ? "bg-electric/10 text-electric ring-electric/30"
                : "text-slate-brand ring-brand-border hover:text-ink",
            )}
          >
            {c.name}
            {c.hint && (
              <span
                className={cn(
                  "ml-1",
                  on ? "text-electric/70" : "text-muted-brand",
                )}
              >
                · {c.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

const ALL_CONTACTS = { limit: 1e9, page: 1, order: "name:asc" } as const;

/** The whole network, for "someone from another Company or without one". */
export function useNetworkContacts(enabled = true) {
  const { data } = useQuery({
    queryKey: [CONTACT_API_KEY, ALL_CONTACTS],
    queryFn: () => getContacts(ALL_CONTACTS),
    enabled,
  });
  return data?.items ?? [];
}

/** A Company's current Contacts. */
export function useCompanyContacts(companyId: number | null) {
  const params = { ...ALL_CONTACTS, company: companyId ?? undefined };
  const { data } = useQuery({
    queryKey: [CONTACT_API_KEY, params],
    queryFn: () => getContacts(params),
    enabled: companyId != null,
  });
  return companyId == null ? [] : (data?.items ?? []);
}

/** Select to add anyone from the network not already listed. */
export function NetworkContactAdder({
  excludeIds,
  onAdd,
  placeholder = "Agregar a alguien de otra empresa o sin empresa…",
}: {
  excludeIds: number[];
  onAdd: (contact: ContactOption) => void;
  placeholder?: string;
}) {
  const network = useNetworkContacts();
  const options = network.filter((c) => !excludeIds.includes(c.id));
  if (options.length === 0) return null;
  return (
    <Select
      value=""
      onValueChange={(value) => {
        const contact = options.find((c) => c.id === Number(value));
        if (contact) {
          onAdd({
            id: contact.id,
            name: contact.name,
            hint: contact.company?.name ?? "Sin empresa",
          });
        }
      }}
    >
      <SelectTrigger className="h-8 w-full text-xs text-slate-brand">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((c) => (
          <SelectItem key={c.id} value={String(c.id)}>
            {c.name} · {c.company?.name ?? "Sin empresa"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ── Writes ──
