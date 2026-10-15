"use client";

import {
  BellRing,
  Building2,
  RotateCcw,
  SlidersHorizontal,
  Tag,
  UserRound,
  X,
} from "lucide-react";
import { useMemo, type ElementType, type ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import type { ContactFilters } from "@workspace/shared/types/contact";

import {
  useCommercialUsers,
  useCompanyOptions,
  useContactSources,
  useCurrentUserId,
} from "./contact-lookups";

function FilterSection({
  icon: Icon,
  title,
  children,
}: {
  icon: ElementType;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-electric" />
        <span className="text-xs font-semibold uppercase tracking-tight text-ink">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

/**
 * "Seguimiento: Para contactar" on or off. On, the list is sorted by the
 * follow-up's due date; off, back to the address book order (by name).
 */
export function withFollowUpFilter(
  filters: ContactFilters,
  mine: boolean,
): ContactFilters {
  if (mine)
    return { ...filters, followUp: "mine", order: "followUp:asc", page: 1 };
  const order = filters.order?.startsWith("followUp")
    ? "name:asc"
    : filters.order;
  return { ...filters, followUp: undefined, order, page: 1 };
}

export function useActiveFilterCount(filters: ContactFilters) {
  return useMemo(() => {
    let count = 0;
    if (filters.followUp != null) count++;
    if (filters.ownerId != null) count++;
    if (filters.sourceId != null) count++;
    if (filters.company != null) count++;
    return count;
  }, [filters]);
}

/** Select value for an "id or none" filter; "" shows the placeholder. */
const selectValue = (value: number | string | undefined) =>
  value == null ? "" : String(value);

const parseIdOrNone = (value: string): number | "none" =>
  value === "none" ? "none" : Number(value);

const parseCompany = (value: string): ContactFilters["company"] =>
  value === "with" || value === "without" ? value : Number(value);

export function ActiveFilterChips({
  filters,
  onFiltersChange,
}: {
  filters: ContactFilters;
  onFiltersChange: (filters: ContactFilters) => void;
}) {
  const users = useCommercialUsers();
  const sources = useContactSources();
  const companies = useCompanyOptions();
  const me = useCurrentUserId();
  const chips: { label: string; onRemove: () => void }[] = [];

  if (filters.followUp === "mine") {
    chips.push({
      label: "Seguimiento: Para contactar",
      onRemove: () => onFiltersChange(withFollowUpFilter(filters, false)),
    });
  }

  if (filters.ownerId != null) {
    const user = users.find((u) => u.id === filters.ownerId);
    const label =
      filters.ownerId === "none"
        ? "Sin responsable"
        : filters.ownerId === me
          ? "Vos"
          : (user?.name ?? "…");
    chips.push({
      label: `Responsable: ${label}`,
      onRemove: () =>
        onFiltersChange({ ...filters, ownerId: undefined, page: 1 }),
    });
  }
  if (filters.sourceId != null) {
    const source = sources.find((s) => s.id === filters.sourceId);
    chips.push({
      label: `Origen: ${filters.sourceId === "none" ? "Sin origen" : (source?.name ?? "…")}`,
      onRemove: () =>
        onFiltersChange({ ...filters, sourceId: undefined, page: 1 }),
    });
  }
  if (filters.company != null) {
    const company = companies.find((c) => c.id === filters.company);
    const label =
      filters.company === "with"
        ? "Con empresa"
        : filters.company === "without"
          ? "Sin empresa"
          : (company?.name ?? "…");
    chips.push({
      label: `Empresa: ${label}`,
      onRemove: () =>
        onFiltersChange({ ...filters, company: undefined, page: 1 }),
    });
  }

  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={chip.onRemove}
          className="group inline-flex items-center gap-1.5 rounded-lg border border-electric/10 bg-electric/[0.06] px-2.5 py-1 text-xs font-medium text-electric transition-all ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-electric/20 hover:bg-electric/[0.12]"
        >
          {chip.label}
          <X className="h-3 w-3 opacity-50 transition-opacity group-hover:opacity-100" />
        </button>
      ))}
    </div>
  );
}

interface ContactFilterPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ContactFilters;
  onFiltersChange: (filters: ContactFilters) => void;
}

export function ContactFilterPanel({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
}: ContactFilterPanelProps) {
  const users = useCommercialUsers();
  const sources = useContactSources();
  const companies = useCompanyOptions();
  const me = useCurrentUserId();
  const activeCount = useActiveFilterCount(filters);
  const set = (patch: Partial<ContactFilters>) =>
    onFiltersChange({ ...filters, ...patch, page: 1 });

  const inputClass =
    "w-full rounded-xl border-brand-border bg-canvas text-sm focus:border-electric focus:ring-electric/10 placeholder:text-muted-brand";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-[95%] flex-col border-brand-border bg-surface p-0 sm:max-w-[560px]"
      >
        <SheetHeader className="space-y-0 border-b border-brand-border/60 px-5 pb-3 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric text-white shadow-[0_2px_8px_-2px_rgba(0,102,255,0.4)]">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold tracking-tight text-ink">
                Filtros
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-brand">
                {activeCount === 0
                  ? "Sin filtros activos"
                  : `${activeCount} filtro${activeCount > 1 ? "s" : ""} activo${activeCount > 1 ? "s" : ""}`}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <FilterSection icon={BellRing} title="Seguimiento">
              <Select
                value={filters.followUp ?? "all"}
                onValueChange={(value) =>
                  onFiltersChange(withFollowUpFilter(filters, value === "mine"))
                }
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mine">
                    Para contactar (a mi cargo)
                  </SelectItem>
                  <SelectItem value="all">Todos los contactos</SelectItem>
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection icon={UserRound} title="Responsable">
              <Select
                value={selectValue(filters.ownerId)}
                onValueChange={(value) =>
                  set({ ownerId: parseIdOrNone(value) })
                }
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Cualquiera" />
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
            </FilterSection>

            <FilterSection icon={Tag} title="Origen">
              <Select
                value={selectValue(filters.sourceId)}
                onValueChange={(value) =>
                  set({ sourceId: parseIdOrNone(value) })
                }
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((source) => (
                    <SelectItem key={source.id} value={String(source.id)}>
                      {source.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="none">Sin origen</SelectItem>
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection icon={Building2} title="Empresa">
              <Select
                value={selectValue(filters.company)}
                onValueChange={(value) => set({ company: parseCompany(value) })}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="with">Con empresa</SelectItem>
                  <SelectItem value="without">Sin empresa</SelectItem>
                  {companies.length > 0 && <SelectSeparator />}
                  {companies.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Una empresa</SelectLabel>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={String(company.id)}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </FilterSection>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-brand-border/60 px-5 py-3">
          <Button
            variant="outline"
            onClick={() =>
              onFiltersChange({
                ...withFollowUpFilter(filters, false),
                ownerId: undefined,
                sourceId: undefined,
                company: undefined,
              })
            }
            className="flex-1 !rounded-xl border-brand-border py-2.5 text-slate-brand transition-all hover:border-electric hover:bg-electric/5 hover:text-ink"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Limpiar todo
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            variant="brand"
            className="flex-1 py-2.5"
          >
            Aplicar filtros
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
