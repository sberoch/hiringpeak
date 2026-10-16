"use client";

import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import {
  AlertTriangle,
  Building2,
  Check,
  ChevronsUpDown,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import type {
  ContactDuplicate,
  ContactDuplicateReason,
} from "@workspace/shared/types/contact";

import { CONTACT_API_KEY, getContactDuplicates } from "@/lib/api/contact";
import {
  useCommercialUsers,
  useCompanyOptions,
  useContactSources,
  useCurrentUserId,
} from "./contact-lookups";

/** A Contact's Company: none, an existing one, or a new one by name. */
export type CompanyChoice =
  | { kind: "none" }
  | { kind: "existing"; id: number }
  | { kind: "new"; name: string };

/** The write payload for a Company choice. */
export function companyChoicePayload(choice: CompanyChoice) {
  if (choice.kind === "existing")
    return { companyId: choice.id, newCompanyName: null };
  if (choice.kind === "new")
    return { companyId: null, newCompanyName: choice.name };
  return { companyId: null, newCompanyName: null };
}

/** Empresa (optional): pick an existing Company or create one by name. */
export function CompanyPicker({
  value,
  onChange,
}: {
  value: CompanyChoice;
  onChange: (value: CompanyChoice) => void;
}) {
  const companies = useCompanyOptions();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected =
    value.kind === "existing"
      ? companies.find((company) => company.id === value.id)
      : null;
  const trimmed = query.trim();
  const exactMatch = companies.some(
    (company) => company.name.toLowerCase() === trimmed.toLowerCase(),
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-surface px-3 text-left text-sm"
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 text-muted-brand" />
              <span className="truncate">{selected.name}</span>
            </span>
          ) : value.kind === "new" ? (
            <span className="flex min-w-0 items-center gap-2">
              <Plus className="h-4 w-4 shrink-0 text-electric" />
              <span className="truncate">{value.name}</span>
              <span className="shrink-0 text-[11px] text-muted-brand">
                (nueva)
              </span>
            </span>
          ) : (
            <span className="truncate text-muted-brand">Sin empresa</span>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar o crear empresa…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No hay empresas con ese nombre.</CommandEmpty>
            {trimmed && !exactMatch && (
              <CommandGroup>
                <CommandItem
                  value={`__new__${trimmed}`}
                  onSelect={() => {
                    onChange({ kind: "new", name: trimmed });
                    setOpen(false);
                  }}
                  className="text-electric"
                >
                  <Plus className="h-4 w-4" />
                  Crear empresa «{trimmed}»
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup>
              {value.kind !== "none" && (
                <CommandItem
                  value="__none__ sin empresa"
                  onSelect={() => {
                    onChange({ kind: "none" });
                    setOpen(false);
                  }}
                  className="text-slate-brand"
                >
                  <span className="h-4 w-4" />
                  Sin empresa
                </CommandItem>
              )}
              {companies.map((company) => (
                <CommandItem
                  key={company.id}
                  value={`${company.name} ${company.id}`}
                  onSelect={() => {
                    onChange({ kind: "existing", id: company.id });
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value.kind === "existing" && value.id === company.id
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  <span className="flex-1 truncate">{company.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Origen as pills; clicking the selected one clears it. */
export function SourcePicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const sources = useContactSources();
  if (sources.length === 0) {
    return (
      <p className="text-xs text-muted-brand">No hay orígenes configurados.</p>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {sources.map((source) => (
        <button
          key={source.id}
          type="button"
          onClick={() => onChange(value === source.id ? null : source.id)}
          className={cn(
            "rounded-full px-3 py-1 text-sm font-medium transition-all",
            value === source.id
              ? "bg-electric text-white"
              : "bg-surface text-ink ring-1 ring-brand-border hover:ring-electric/40",
          )}
        >
          {source.name}
        </button>
      ))}
    </div>
  );
}

/** Responsable (Contact Owner): users with commercial access only. */
export function OwnerPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const users = useCommercialUsers();
  const me = useCurrentUserId();
  return (
    <Select
      value={value == null ? "none" : String(value)}
      onValueChange={(next) => onChange(next === "none" ? null : Number(next))}
    >
      <SelectTrigger className="h-9 w-full bg-surface text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {users.map((user) => (
          <SelectItem key={user.id} value={String(user.id)}>
            {user.id === me ? `${user.name} (vos)` : user.name}
          </SelectItem>
        ))}
        <SelectItem value="none">Sin responsable</SelectItem>
      </SelectContent>
    </Select>
  );
}

const REASON_LABEL: Record<ContactDuplicateReason, string> = {
  email: "mismo email",
  linkedin: "mismo LinkedIn",
  name: "mismo nombre",
};

/** Probable duplicates while typing a new Contact (debounced API check). */
export function useContactDuplicates(probe: {
  name: string;
  email: string;
  linkedin: string;
}) {
  const debounced = useDebounce(probe, 400);
  const hasProbe =
    debounced.name.trim().length > 3 ||
    !!debounced.email.trim() ||
    !!debounced.linkedin.trim();
  const { data } = useQuery({
    queryKey: [CONTACT_API_KEY, "duplicates", debounced],
    queryFn: () => getContactDuplicates(debounced),
    enabled: hasProbe,
  });
  return hasProbe ? (data ?? []) : [];
}

/** Warns, never blocks: who it matches and why, with a link to open them. */
export function DuplicateNotice({
  duplicates,
  className,
}: {
  duplicates: ContactDuplicate[];
  className?: string;
}) {
  if (duplicates.length === 0) return null;
  return (
    <div
      className={cn(
        "rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm",
        className,
      )}
      role="status"
    >
      <p className="flex items-center gap-1.5 font-semibold text-amber-800">
        <AlertTriangle className="h-4 w-4" />
        {duplicates.length === 1
          ? "Puede que ya lo tengas cargado"
          : `Puede que ya lo tengas cargado (${duplicates.length} parecidos)`}
      </p>
      <ul className="mt-1.5 space-y-1">
        {duplicates.map((duplicate) => (
          <li
            key={duplicate.id}
            className="flex flex-wrap items-baseline gap-x-1.5 text-amber-900"
          >
            <Link
              href={`/contacts/${duplicate.id}`}
              className="font-semibold underline-offset-2 hover:underline"
            >
              {duplicate.name}
            </Link>
            <span className="text-amber-800/80">
              {[duplicate.role, duplicate.company?.name ?? "Sin empresa"]
                .filter(Boolean)
                .join(" · ")}
            </span>
            <span className="rounded bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-800">
              {REASON_LABEL[duplicate.reason]}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-xs text-amber-800/80">
        Podés guardarlo igual si es otra persona.
      </p>
    </div>
  );
}
