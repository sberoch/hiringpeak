"use client";

import {
  Building2,
  RotateCcw,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";
import type { ElementType, ReactNode } from "react";

import { CompanyStatus } from "@workspace/shared/enums";
import type { CompanyFilters } from "@workspace/shared/types/company";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
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

import {
  useCommercialUsers,
  useCurrentUserId,
} from "@/components/contacts/contact-lookups";

const STATUS_LABELS: Record<CompanyStatus, string> = {
  [CompanyStatus.PROSPECT]: "Prospectos",
  [CompanyStatus.CLIENT]: "Clientes",
};

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

export function activeFilterCount(filters: CompanyFilters) {
  return [filters.status, filters.accountOwnerId].filter((v) => v != null)
    .length;
}

/** Select value for an optional filter; "" shows the placeholder. */
const selectValue = (value: number | string | undefined) =>
  value == null ? "" : String(value);

/** Only mounted with commercial access: recruiters can't list commercial users. */
function OwnerName({ id }: { id: number }) {
  const users = useCommercialUsers();
  const me = useCurrentUserId();
  if (id === me) return "Vos";
  return users.find((u) => u.id === id)?.name ?? "…";
}

function AccountOwnerSelect({
  value,
  onChange,
  className,
}: {
  value: number | undefined;
  onChange: (id: number) => void;
  className: string;
}) {
  const users = useCommercialUsers();
  const me = useCurrentUserId();
  return (
    <Select
      value={selectValue(value)}
      onValueChange={(next) => onChange(Number(next))}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Cualquiera" />
      </SelectTrigger>
      <SelectContent>
        {users.map((user) => (
          <SelectItem key={user.id} value={String(user.id)}>
            {user.id === me ? `${user.name} (vos)` : user.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ActiveFilterChips({
  filters,
  onFiltersChange,
}: {
  filters: CompanyFilters;
  onFiltersChange: (filters: CompanyFilters) => void;
}) {
  const chips: { key: string; label: ReactNode; onRemove: () => void }[] = [];

  if (filters.status != null) {
    chips.push({
      key: "status",
      label: `Tipo: ${STATUS_LABELS[filters.status]}`,
      onRemove: () =>
        onFiltersChange({ ...filters, status: undefined, page: 1 }),
    });
  }
  if (filters.accountOwnerId != null) {
    const ownerId = filters.accountOwnerId;
    chips.push({
      key: "accountOwnerId",
      label: (
        <>
          Responsable: <OwnerName id={ownerId} />
        </>
      ),
      onRemove: () =>
        onFiltersChange({ ...filters, accountOwnerId: undefined, page: 1 }),
    });
  }

  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
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

interface CompanyFilterPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: CompanyFilters;
  onFiltersChange: (filters: CompanyFilters) => void;
  /** The Account Owner filter is part of the commercial side. */
  commercial: boolean;
}

export function CompanyFilterPanel({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  commercial,
}: CompanyFilterPanelProps) {
  const count = activeFilterCount(filters);
  const set = (patch: Partial<CompanyFilters>) =>
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
                {count === 0
                  ? "Sin filtros activos"
                  : `${count} filtro${count > 1 ? "s" : ""} activo${count > 1 ? "s" : ""}`}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <FilterSection icon={Building2} title="Tipo">
              <Select
                value={selectValue(filters.status)}
                onValueChange={(value) =>
                  set({ status: value as CompanyStatus })
                }
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Prospectos y clientes" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(CompanyStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            {commercial && (
              <FilterSection icon={UserRound} title="Responsable de la cuenta">
                <AccountOwnerSelect
                  value={filters.accountOwnerId}
                  onChange={(id) => set({ accountOwnerId: id })}
                  className={inputClass}
                />
              </FilterSection>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-brand-border/60 px-5 py-3">
          <Button
            variant="outline"
            onClick={() =>
              onFiltersChange({
                ...filters,
                status: undefined,
                accountOwnerId: undefined,
                page: 1,
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
