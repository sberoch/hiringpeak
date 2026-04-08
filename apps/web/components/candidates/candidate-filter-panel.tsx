"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Globe,
  GraduationCap,
  Languages,
  MapPin,
  RotateCcw,
  SlidersHorizontal,
  Star,
  User,
  Users,
  X,
} from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
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
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@workspace/ui/components/sheet";
import { AREAS_API_KEY, getAllAreas } from "@/lib/api/area";
import { getAllIndustries, INDUSTRIES_API_KEY } from "@/lib/api/industry";
import { getAllSeniorities, SENIORITY_API_KEY } from "@/lib/api/seniority";
import countries from "@/public/assets/countries.json";
import languages from "@/public/assets/languages.json";
import provinces from "@/public/assets/provinces.json";
import type { CandidateFilters } from "@workspace/shared/types/candidate";

interface CandidateFilterPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: CandidateFilters;
  onFiltersChange: (filters: CandidateFilters) => void;
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

export function useActiveFilterCount(filters: CandidateFilters) {
  return useMemo(() => {
    let count = 0;
    if (filters.seniorities?.length) count++;
    if (filters.areas?.length) count++;
    if (filters.industries?.length) count++;
    if (filters.minimumStars) count++;
    if (filters.gender) count++;
    if (filters.countries?.length) count++;
    if (filters.provinces?.length) count++;
    if (filters.languages?.length) count++;
    if (filters.minimumAge) count++;
    if (filters.maximumAge) count++;
    if (filters.blacklisted) count++;
    return count;
  }, [filters]);
}

export function ActiveFilterChips({
  filters,
  onFiltersChange,
}: {
  filters: CandidateFilters;
  onFiltersChange: (filters: CandidateFilters) => void;
}) {
  const chips: { label: string; onRemove: () => void }[] = [];

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
  if (filters.minimumStars) {
    chips.push({
      label: `${filters.minimumStars}+ estrellas`,
      onRemove: () => onFiltersChange({ ...filters, minimumStars: undefined }),
    });
  }
  if (filters.gender) {
    chips.push({
      label: `Género: ${filters.gender}`,
      onRemove: () => onFiltersChange({ ...filters, gender: undefined }),
    });
  }
  if (filters.countries?.length) {
    const label =
      filters.countries.length === 1
        ? filters.countries[0]
        : `${filters.countries.length} países`;
    chips.push({
      label: `País: ${label}`,
      onRemove: () =>
        onFiltersChange({
          ...filters,
          countries: undefined,
          provinces: undefined,
        }),
    });
  }
  if (filters.provinces?.length) {
    const label =
      filters.provinces.length === 1
        ? filters.provinces[0]
        : `${filters.provinces.length} provincias`;
    chips.push({
      label: `Provincia: ${label}`,
      onRemove: () => onFiltersChange({ ...filters, provinces: undefined }),
    });
  }
  if (filters.languages?.length) {
    const label =
      filters.languages.length === 1
        ? filters.languages[0]
        : `${filters.languages.length} idiomas`;
    chips.push({
      label: `Idioma: ${label}`,
      onRemove: () => onFiltersChange({ ...filters, languages: undefined }),
    });
  }
  if (filters.minimumAge) {
    chips.push({
      label: `Edad mín: ${filters.minimumAge}`,
      onRemove: () => onFiltersChange({ ...filters, minimumAge: undefined }),
    });
  }
  if (filters.maximumAge) {
    chips.push({
      label: `Edad máx: ${filters.maximumAge}`,
      onRemove: () => onFiltersChange({ ...filters, maximumAge: undefined }),
    });
  }
  if (filters.blacklisted) {
    chips.push({
      label: "Incluye blacklist",
      onRemove: () => onFiltersChange({ ...filters, blacklisted: false }),
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

export function CandidateFilterPanel({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  resetFilters,
}: CandidateFilterPanelProps) {
  const { data: industries } = useQuery({
    queryKey: [INDUSTRIES_API_KEY, { page: 1, limit: 1e9 }],
    queryFn: () => getAllIndustries({ page: 1, limit: 1e9 }),
  });

  const { data: seniorities } = useQuery({
    queryKey: [SENIORITY_API_KEY, { page: 1, limit: 1e9 }],
    queryFn: () => getAllSeniorities({ page: 1, limit: 1e9 }),
  });

  const { data: areas } = useQuery({
    queryKey: [AREAS_API_KEY, { page: 1, limit: 1e9 }],
    queryFn: () => getAllAreas({ page: 1, limit: 1e9 }),
  });

  const availableProvinces = useMemo(() => {
    const selectedCountries = filters.countries;
    if (!selectedCountries) return [];
    return (
      provinces
        .filter((p) => selectedCountries.includes(p.country))
        .flatMap((p) => p.provinces) ?? []
    );
  }, [filters.countries]);

  const activeCount = useActiveFilterCount(filters);

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

          {/* ── Ubicación e idioma ── */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <FilterSection icon={Globe} title="País">
              <MultiSelector
                values={filters.countries ?? []}
                onValuesChange={(names) =>
                  onFiltersChange({ ...filters, countries: names })
                }
              >
                <MultiSelectorTrigger className={inputClass}>
                  <MultiSelectorInput placeholder="Seleccionar..." />
                </MultiSelectorTrigger>
                <MultiSelectorContent>
                  <MultiSelectorList className="bg-surface">
                    {countries.map((c) => (
                      <MultiSelectorItem
                        key={c.name}
                        value={c.name}
                        className="bg-surface my-0.5"
                      >
                        {c.name}
                      </MultiSelectorItem>
                    ))}
                  </MultiSelectorList>
                </MultiSelectorContent>
              </MultiSelector>
            </FilterSection>

            {availableProvinces.length > 0 ? (
              <FilterSection icon={MapPin} title="Provincia">
                <MultiSelector
                  values={filters.provinces ?? []}
                  onValuesChange={(names) =>
                    onFiltersChange({
                      ...filters,
                      provinces: availableProvinces.filter((p) =>
                        names.includes(p),
                      ),
                    })
                  }
                >
                  <MultiSelectorTrigger className={inputClass}>
                    <MultiSelectorInput placeholder="Seleccionar..." />
                  </MultiSelectorTrigger>
                  <MultiSelectorContent>
                    <MultiSelectorList className="bg-surface">
                      {availableProvinces.map((p) => (
                        <MultiSelectorItem
                          key={p}
                          value={p}
                          className="bg-surface my-0.5"
                        >
                          {p}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
              </FilterSection>
            ) : (
              <FilterSection icon={Languages} title="Idioma">
                <MultiSelector
                  values={filters.languages ?? []}
                  onValuesChange={(names) =>
                    onFiltersChange({ ...filters, languages: names })
                  }
                >
                  <MultiSelectorTrigger className={inputClass}>
                    <MultiSelectorInput placeholder="Seleccionar..." />
                  </MultiSelectorTrigger>
                  <MultiSelectorContent>
                    <MultiSelectorList className="bg-surface">
                      {languages.map((l) => (
                        <MultiSelectorItem
                          key={l.name}
                          value={l.name}
                          className="bg-surface my-0.5"
                        >
                          {l.name}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
              </FilterSection>
            )}

            {availableProvinces.length > 0 && (
              <div className="col-span-2">
                <FilterSection icon={Languages} title="Idioma">
                  <MultiSelector
                    values={filters.languages ?? []}
                    onValuesChange={(names) =>
                      onFiltersChange({ ...filters, languages: names })
                    }
                  >
                    <MultiSelectorTrigger className={inputClass}>
                      <MultiSelectorInput placeholder="Seleccionar..." />
                    </MultiSelectorTrigger>
                    <MultiSelectorContent>
                      <MultiSelectorList className="bg-surface">
                        {languages.map((l) => (
                          <MultiSelectorItem
                            key={l.name}
                            value={l.name}
                            className="bg-surface my-0.5"
                          >
                            {l.name}
                          </MultiSelectorItem>
                        ))}
                      </MultiSelectorList>
                    </MultiSelectorContent>
                  </MultiSelector>
                </FilterSection>
              </div>
            )}
          </div>

          <div className="h-px bg-brand-border/60" />

          {/* ── Demografía ── */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <FilterSection icon={Star} title="Calificación mínima">
              <Select
                value={filters.minimumStars?.toString() ?? ""}
                onValueChange={(v) =>
                  onFiltersChange({ ...filters, minimumStars: parseInt(v) })
                }
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 estrellas</SelectItem>
                  <SelectItem value="4">4+ estrellas</SelectItem>
                  <SelectItem value="3">3+ estrellas</SelectItem>
                  <SelectItem value="2">2+ estrellas</SelectItem>
                  <SelectItem value="1">1+ estrellas</SelectItem>
                </SelectContent>
              </Select>
            </FilterSection>

            <FilterSection icon={User} title="Género">
              <Select
                value={filters.gender ?? ""}
                onValueChange={(v) =>
                  onFiltersChange({ ...filters, gender: v })
                }
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Femenino">Femenino</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </FilterSection>

            <div className="col-span-2">
              <FilterSection icon={Users} title="Rango de edad">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder="Edad mínima"
                    className={inputClass}
                    value={filters.minimumAge ?? ""}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        minimumAge:
                          e.target.value !== ""
                            ? parseInt(e.target.value)
                            : undefined,
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Edad máxima"
                    className={inputClass}
                    value={filters.maximumAge ?? ""}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        maximumAge:
                          e.target.value !== ""
                            ? parseInt(e.target.value)
                            : undefined,
                      })
                    }
                  />
                </div>
              </FilterSection>
            </div>

            <div className="col-span-2">
              <FilterSection icon={Users} title="Candidatos en blacklist">
                <div className="flex items-center gap-2.5 rounded-xl border border-brand-border bg-canvas px-3 py-2.5">
                  <Checkbox
                    id="blacklist-panel"
                    checked={!!filters.blacklisted}
                    onCheckedChange={(checked) =>
                      onFiltersChange({
                        ...filters,
                        blacklisted:
                          checked === "indeterminate" ? false : checked,
                      })
                    }
                  />
                  <Label
                    htmlFor="blacklist-panel"
                    className="text-sm font-medium text-ink leading-none cursor-pointer select-none"
                  >
                    Incluir
                  </Label>
                </div>
              </FilterSection>
            </div>
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
