"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Building2,
  GraduationCap,
  RotateCcw,
  SlidersHorizontal,
  Tag,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from "@workspace/ui/components/multi-select";
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
import { AREAS_API_KEY, getAllAreas } from "@/lib/api/area";
import { COMPANIES_API_KEY, getAllCompanies } from "@/lib/api/company";
import { getAllIndustries, INDUSTRIES_API_KEY } from "@/lib/api/industry";
import { getAllSeniorities, SENIORITY_API_KEY } from "@/lib/api/seniority";
import { getAllUsers, USERS_API_KEY } from "@/lib/api/user";
import {
  getAllVacancyStatuses,
  VACANCY_STATUS_API_KEY,
} from "@/lib/api/vacancy-status";
import { CompanyStatusEnum } from "@workspace/shared/types/company";
import type { VacancyFiltersType } from "@workspace/shared/types/vacancy";

interface VacancyFilterPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: VacancyFiltersType;
  onFiltersChange: (filters: VacancyFiltersType) => void;
  resetFilters: () => void;
}

function FilterSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-electric" />
        <span className="text-xs font-semibold text-ink tracking-tight uppercase">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

export function useActiveVacancyFilterCount(filters: VacancyFiltersType) {
  return useMemo(() => {
    let count = 0;
    if (filters.status) count++;
    if (filters.seniorities?.length) count++;
    if (filters.industries?.length) count++;
    if (filters.areas?.length) count++;
    if (filters.company) count++;
    if (filters.createdBy) count++;
    if (filters.assignedTo) count++;
    return count;
  }, [filters]);
}

export function ActiveVacancyFilterChips({
  filters,
  onFiltersChange,
}: {
  filters: VacancyFiltersType;
  onFiltersChange: (filters: VacancyFiltersType) => void;
}) {
  const { data: users } = useQuery({
    queryKey: [USERS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllUsers({ limit: 1e9, page: 1 }),
    enabled: !!(filters.createdBy || filters.assignedTo),
  });

  const chips: { label: string; onRemove: () => void }[] = [];

  if (filters.status) {
    chips.push({
      label: `Estado: ${filters.status.name}`,
      onRemove: () => onFiltersChange({ ...filters, status: undefined }),
    });
  }
  if (filters.seniorities?.length) {
    const label =
      filters.seniorities.length === 1
        ? filters.seniorities[0]!.name
        : `${filters.seniorities.length} seniorities`;
    chips.push({
      label: `Seniority: ${label}`,
      onRemove: () => onFiltersChange({ ...filters, seniorities: undefined }),
    });
  }
  if (filters.areas?.length) {
    const label =
      filters.areas.length === 1
        ? filters.areas[0]!.name
        : `${filters.areas.length} áreas`;
    chips.push({
      label: `Área: ${label}`,
      onRemove: () => onFiltersChange({ ...filters, areas: undefined }),
    });
  }
  if (filters.industries?.length) {
    const label =
      filters.industries.length === 1
        ? filters.industries[0]!.name
        : `${filters.industries.length} industrias`;
    chips.push({
      label: `Industria: ${label}`,
      onRemove: () => onFiltersChange({ ...filters, industries: undefined }),
    });
  }
  if (filters.company) {
    chips.push({
      label: `Empresa: ${filters.company.name}`,
      onRemove: () => onFiltersChange({ ...filters, company: undefined }),
    });
  }
  if (filters.createdBy) {
    const userName = users?.items.find((u) => u.id === filters.createdBy)?.name ?? `#${filters.createdBy}`;
    chips.push({
      label: `Creado por: ${userName}`,
      onRemove: () => onFiltersChange({ ...filters, createdBy: undefined }),
    });
  }
  if (filters.assignedTo) {
    const userName = users?.items.find((u) => u.id === filters.assignedTo)?.name ?? `#${filters.assignedTo}`;
    chips.push({
      label: `Asignado a: ${userName}`,
      onRemove: () => onFiltersChange({ ...filters, assignedTo: undefined }),
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
          className="group inline-flex items-center gap-1.5 rounded-lg bg-electric/[0.06] px-2.5 py-1 text-xs font-medium text-electric border border-electric/10 hover:bg-electric/[0.12] hover:border-electric/20 transition-all ease-[cubic-bezier(0.16,1,0.3,1)]"
        >
          {chip.label}
          <X className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
        </button>
      ))}
    </div>
  );
}

export function VacancyFilterPanel({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  resetFilters,
}: VacancyFilterPanelProps) {
  const { data: statuses } = useQuery({
    queryKey: [VACANCY_STATUS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllVacancyStatuses({ limit: 1e9, page: 1 }),
  });

  const { data: seniorities } = useQuery({
    queryKey: [SENIORITY_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllSeniorities({ limit: 1e9, page: 1 }),
  });

  const { data: industries } = useQuery({
    queryKey: [INDUSTRIES_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllIndustries({ limit: 1e9, page: 1 }),
  });

  const { data: areas } = useQuery({
    queryKey: [AREAS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllAreas({ limit: 1e9, page: 1 }),
  });

  const { data: companies } = useQuery({
    queryKey: [
      COMPANIES_API_KEY,
      { limit: 1e9, page: 1, status: CompanyStatusEnum.ACTIVE },
    ],
    queryFn: () =>
      getAllCompanies({
        limit: 1e9,
        page: 1,
        status: CompanyStatusEnum.ACTIVE,
      }),
  });

  const { data: users } = useQuery({
    queryKey: [USERS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllUsers({ limit: 1e9, page: 1 }),
  });

  const activeCount = useActiveVacancyFilterCount(filters);

  const inputClass =
    "rounded-xl border-brand-border bg-canvas text-sm focus:border-electric focus:ring-electric/10 placeholder:text-muted-brand";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[95%] sm:max-w-[560px] bg-surface border-brand-border p-0 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-brand-border/60 space-y-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric text-white shadow-[0_2px_8px_-2px_rgba(0,102,255,0.4)]">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold text-ink tracking-tight">
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

        {/* Scrollable filter sections */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* ── Estado y empresa ── */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <FilterSection icon={Tag} title="Estado">
              <Select
                value={filters.status?.name ?? ""}
                onValueChange={(status) =>
                  onFiltersChange({
                    ...filters,
                    status: statuses?.items.find((f) => f.name === status),
                  })
                }
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent>
                  {statuses?.items.map((status) => (
                    <SelectItem key={status.id} value={status.name}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection icon={Building2} title="Empresa">
              <Select
                value={filters.company?.id?.toString() ?? ""}
                onValueChange={(companyId) =>
                  onFiltersChange({
                    ...filters,
                    company: companies?.items.find(
                      (c) => c.id.toString() === companyId,
                    ),
                  })
                }
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent>
                  {companies?.items.map((company) => (
                    <SelectItem
                      key={company.id}
                      value={company.id.toString()}
                    >
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>
          </div>

          <div className="h-px bg-brand-border/60" />

          {/* ── Profesional ── */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <FilterSection icon={GraduationCap} title="Seniority">
              <MultiSelector
                values={filters.seniorities?.map((s) => s.name) ?? []}
                onValuesChange={(names) =>
                  onFiltersChange({
                    ...filters,
                    seniorities: seniorities?.items.filter((s) =>
                      names.includes(s.name),
                    ),
                  })
                }
              >
                <MultiSelectorTrigger className={inputClass}>
                  <MultiSelectorInput placeholder="Seleccionar..." />
                </MultiSelectorTrigger>
                <MultiSelectorContent>
                  <MultiSelectorList className="bg-surface">
                    {seniorities?.items.map((s) => (
                      <MultiSelectorItem
                        className="bg-surface my-0.5"
                        key={s.id}
                        value={s.name}
                      >
                        {s.name}
                      </MultiSelectorItem>
                    ))}
                  </MultiSelectorList>
                </MultiSelectorContent>
              </MultiSelector>
            </FilterSection>

            <FilterSection icon={Briefcase} title="Área">
              <MultiSelector
                values={filters.areas?.map((a) => a.name) ?? []}
                onValuesChange={(names) =>
                  onFiltersChange({
                    ...filters,
                    areas: areas?.items.filter((f) => names.includes(f.name)),
                  })
                }
              >
                <MultiSelectorTrigger className={inputClass}>
                  <MultiSelectorInput placeholder="Seleccionar..." />
                </MultiSelectorTrigger>
                <MultiSelectorContent>
                  <MultiSelectorList className="bg-surface">
                    {areas?.items.map((a) => (
                      <MultiSelectorItem
                        key={a.id}
                        value={a.name}
                        className="bg-surface my-0.5"
                      >
                        {a.name}
                      </MultiSelectorItem>
                    ))}
                  </MultiSelectorList>
                </MultiSelectorContent>
              </MultiSelector>
            </FilterSection>

            <div className="col-span-2">
              <FilterSection icon={Briefcase} title="Industria">
                <MultiSelector
                  values={filters.industries?.map((i) => i.name) ?? []}
                  onValuesChange={(names) =>
                    onFiltersChange({
                      ...filters,
                      industries: industries?.items.filter((f) =>
                        names.includes(f.name),
                      ),
                    })
                  }
                >
                  <MultiSelectorTrigger className={inputClass}>
                    <MultiSelectorInput placeholder="Seleccionar..." />
                  </MultiSelectorTrigger>
                  <MultiSelectorContent>
                    <MultiSelectorList className="bg-surface">
                      {industries?.items.map((i) => (
                        <MultiSelectorItem
                          key={i.id}
                          value={i.name}
                          className="bg-surface my-0.5"
                        >
                          {i.name}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
              </FilterSection>
            </div>
          </div>

          <div className="h-px bg-brand-border/60" />

          {/* ── Usuarios ── */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <FilterSection icon={UserPlus} title="Creado por">
              <Select
                value={filters.createdBy?.toString() ?? ""}
                onValueChange={(userId) =>
                  onFiltersChange({
                    ...filters,
                    createdBy: parseInt(userId),
                  })
                }
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent>
                  {users?.items.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection icon={UserCheck} title="Asignado a">
              <Select
                value={filters.assignedTo?.toString() ?? ""}
                onValueChange={(userId) =>
                  onFiltersChange({
                    ...filters,
                    assignedTo: parseInt(userId),
                  })
                }
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent>
                  {users?.items.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-brand-border/60 px-5 py-3 flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              resetFilters();
            }}
            className="flex-1 !rounded-xl border-brand-border text-slate-brand hover:text-ink hover:border-electric hover:bg-electric/5 transition-all py-2.5"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Limpiar todo
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="flex-1 !rounded-xl bg-electric hover:bg-electric-light text-white font-semibold hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.3)] transition-all py-2.5"
          >
            Aplicar filtros
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
