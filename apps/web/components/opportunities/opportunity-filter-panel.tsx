"use client";

import {
  Building2,
  CalendarX,
  RotateCcw,
  SlidersHorizontal,
  ThumbsDown,
  UserRound,
  X,
} from "lucide-react";
import type { ElementType, ReactNode } from "react";

import { CompanyStatus } from "@workspace/shared/enums";
import type { OpportunityFilters } from "@workspace/shared/types/opportunity";
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
  useLostReasons,
} from "@/components/opportunities/commercial-queries";

/** Everything the panel filters by; the search box lives on the page. */
export type OpportunityPanelFilters = Omit<OpportunityFilters, "search">;

const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
  [CompanyStatus.PROSPECT]: "Solo prospectos",
  [CompanyStatus.CLIENT]: "Solo clientes",
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

export function activeFilterCount(filters: OpportunityPanelFilters) {
  return [
    filters.ownerId,
    filters.lostReasonId,
    filters.companyStatus,
    filters.noNextStep,
  ].filter((value) => value != null).length;
}

/** Select value for an optional filter; "" shows the placeholder. */
const selectValue = (value: number | string | undefined) =>
  value == null ? "" : String(value);

export function ActiveFilterChips({
  filters,
  onFiltersChange,
  myId,
}: {
  filters: OpportunityPanelFilters;
  onFiltersChange: (filters: OpportunityPanelFilters) => void;
  myId: number | undefined;
}) {
  const { data: users = [] } = useCommercialUsers();
  const { data: lostReasons = [] } = useLostReasons();
  const chips: { label: string; onRemove: () => void }[] = [];

  if (filters.ownerId != null) {
    const user = users.find((u) => u.id === filters.ownerId);
    chips.push({
      label: `Responsable: ${filters.ownerId === myId ? "Vos" : (user?.name ?? "…")}`,
      onRemove: () => onFiltersChange({ ...filters, ownerId: undefined }),
    });
  }
  if (filters.companyStatus != null) {
    chips.push({
      label: `Empresa: ${COMPANY_STATUS_LABELS[filters.companyStatus]}`,
      onRemove: () => onFiltersChange({ ...filters, companyStatus: undefined }),
    });
  }
  if (filters.lostReasonId != null) {
    const reason = lostReasons.find((r) => r.id === filters.lostReasonId);
    chips.push({
      label: `Motivo de pérdida: ${reason?.name ?? "…"}`,
      onRemove: () => onFiltersChange({ ...filters, lostReasonId: undefined }),
    });
  }
  if (filters.noNextStep) {
    chips.push({
      label: "Solo sin próximo paso",
      onRemove: () => onFiltersChange({ ...filters, noNextStep: undefined }),
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

interface OpportunityFilterPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: OpportunityPanelFilters;
  onFiltersChange: (filters: OpportunityPanelFilters) => void;
  myId: number | undefined;
}

export function OpportunityFilterPanel({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  myId,
}: OpportunityFilterPanelProps) {
  const { data: users = [] } = useCommercialUsers();
  const { data: lostReasons = [] } = useLostReasons();
  const count = activeFilterCount(filters);
  const set = (patch: Partial<OpportunityPanelFilters>) =>
    onFiltersChange({ ...filters, ...patch });

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
            <FilterSection icon={UserRound} title="Responsable">
              <Select
                value={selectValue(filters.ownerId)}
                onValueChange={(value) => set({ ownerId: Number(value) })}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.id === myId ? `${user.name} (vos)` : user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection icon={Building2} title="Empresa">
              <Select
                value={selectValue(filters.companyStatus)}
                onValueChange={(value) =>
                  set({ companyStatus: value as CompanyStatus })
                }
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Prospectos y clientes" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(CompanyStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {COMPANY_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection icon={ThumbsDown} title="Motivo de pérdida">
              <Select
                value={selectValue(filters.lostReasonId)}
                onValueChange={(value) => set({ lostReasonId: Number(value) })}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent>
                  {lostReasons.map((reason) => (
                    <SelectItem key={reason.id} value={String(reason.id)}>
                      {reason.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection icon={CalendarX} title="Próximo paso">
              <Select
                value={filters.noNextStep ? "none" : "all"}
                onValueChange={(value) =>
                  set({ noNextStep: value === "none" || undefined })
                }
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las oportunidades</SelectItem>
                  <SelectItem value="none">Solo sin próximo paso</SelectItem>
                </SelectContent>
              </Select>
            </FilterSection>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-brand-border/60 px-5 py-3">
          <Button
            variant="outline"
            onClick={() => onFiltersChange({})}
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
