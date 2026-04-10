"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, RotateCcw, Search } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
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
import { AREAS_API_KEY, getAllAreas } from "@/lib/api/area";
import { getAllIndustries, INDUSTRIES_API_KEY } from "@/lib/api/industry";
import { getAllSeniorities, SENIORITY_API_KEY } from "@/lib/api/seniority";
import {
  countries,
  languages,
  provinceGroups as provinces,
} from "@workspace/shared/static/catalogs";
import type { CandidateFilters as CandidateFiltersType } from "@workspace/shared/types/candidate";
import { cn } from "@/lib/utils";

interface CandidateFiltersProps {
  filters: CandidateFiltersType;
  onFiltersChange: (filters: CandidateFiltersType) => void;
  resetFilters: () => void;
  clearFilters?: () => void;
}

export function CandidateFilters({
  filters = {},
  onFiltersChange,
  resetFilters,
  clearFilters,
}: CandidateFiltersProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  return (
    <Card className={cn("rounded-2xl border-brand-border bg-surface", isCollapsed && "gap-0")}>
      <CardHeader className={cn("pb-0 gap-0 relative flex flex-row items-center w-full justify-between", !isCollapsed && "pt-4 px-4")}>
        <CardTitle className="text-base font-semibold text-ink flex items-center gap-2">
          <Search className="h-4 w-4 text-electric" />
          Filtros y Búsqueda
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-brand hover:text-ink hover:bg-brand-border-light transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      {!isCollapsed ? (
        <CardContent className="p-4">
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 lg:gap-4">
              <div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-brand" />
                  <Input
                    id="search"
                    type="search"
                    placeholder="Buscar por nombre..."
                    className="pl-8 rounded-xl border-brand-border bg-canvas focus:border-electric focus:ring-electric/10"
                    value={filters.name}
                    onChange={(e) =>
                      onFiltersChange({ ...filters, name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <MultiSelector
                  values={filters.seniorities?.map((s) => s.name) ?? []}
                  onValuesChange={(senioritiesNames) =>
                    onFiltersChange({
                      ...filters,
                      seniorities: seniorities?.items.filter((s) =>
                        senioritiesNames.includes(s.name)
                      ),
                    })
                  }
                >
                  <MultiSelectorTrigger>
                    <MultiSelectorInput placeholder="Seleccionar seniority" />
                  </MultiSelectorTrigger>
                  <MultiSelectorContent>
                    <MultiSelectorList className="bg-white">
                      {seniorities?.items.map((seniority) => (
                        <MultiSelectorItem
                          className="bg-white my-1"
                          key={seniority.id}
                          value={seniority.name}
                        >
                          {seniority.name}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
              </div>

              <div>
                <MultiSelector
                  values={filters.areas?.map((a) => a.name) ?? []}
                  onValuesChange={(areaNames) =>
                    onFiltersChange({
                      ...filters,
                      areas: areas?.items.filter((f) =>
                        areaNames.includes(f.name)
                      ),
                    })
                  }
                >
                  <MultiSelectorTrigger>
                    <MultiSelectorInput placeholder="Seleccionar área" />
                  </MultiSelectorTrigger>
                  <MultiSelectorContent>
                    <MultiSelectorList className="bg-white">
                      {areas?.items.map((area) => (
                        <MultiSelectorItem
                          key={area.id}
                          value={area.name}
                          className="bg-white my-1"
                        >
                          {area.name}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 lg:gap-4">
              <div>
                <MultiSelector
                  values={filters.industries?.map((i) => i.name) ?? []}
                  onValuesChange={(indNames) => {
                    onFiltersChange({
                      ...filters,
                      industries: industries?.items.filter((f) =>
                        indNames.includes(f.name)
                      ),
                    });
                  }}
                >
                  <MultiSelectorTrigger>
                    <MultiSelectorInput placeholder="Seleccionar industria" />
                  </MultiSelectorTrigger>
                  <MultiSelectorContent>
                    <MultiSelectorList className="bg-white">
                      {industries?.items.map((industry) => (
                        <MultiSelectorItem
                          key={industry.id}
                          value={industry.name}
                          className="bg-white my-1"
                        >
                          {industry.name}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
              </div>

              <div>
                <Select
                  value={filters.minimumStars?.toString() ?? ""}
                  onValueChange={(v) =>
                    onFiltersChange({ ...filters, minimumStars: parseInt(v) })
                  }
                >
                  <SelectTrigger id="rating">
                    <SelectValue placeholder="Seleccionar calificación mínima" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 estrellas</SelectItem>
                    <SelectItem value="4">4+ estrellas</SelectItem>
                    <SelectItem value="3">3+ estrellas</SelectItem>
                    <SelectItem value="2">2+ estrellas</SelectItem>
                    <SelectItem value="1">1+ estrellas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select
                  value={filters.gender ?? ""}
                  onValueChange={(v) =>
                    onFiltersChange({ ...filters, gender: v })
                  }
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Seleccionar género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Femenino">Femenino</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 lg:gap-4">
              <div>
                <MultiSelector
                  values={filters.countries ?? []}
                  onValuesChange={(countriesNames) => {
                    onFiltersChange({ ...filters, countries: countriesNames });
                  }}
                >
                  <MultiSelectorTrigger>
                    <MultiSelectorInput placeholder="Seleccionar país" />
                  </MultiSelectorTrigger>
                  <MultiSelectorContent>
                    <MultiSelectorList className="bg-white">
                      {countries.map((country) => (
                        <MultiSelectorItem
                          key={country.name}
                          value={country.name}
                          className="bg-white my-1"
                        >
                          {country.name}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
              </div>
              <div>
                <MultiSelector
                  values={filters.provinces ?? []}
                  onValuesChange={(provincesNames) => {
                    onFiltersChange({
                      ...filters,
                      provinces: availableProvinces.filter((p) =>
                        provincesNames.includes(p)
                      ),
                    });
                  }}
                >
                  <MultiSelectorTrigger>
                    <MultiSelectorInput placeholder="Seleccionar provincia" />
                  </MultiSelectorTrigger>
                  <MultiSelectorContent>
                    <MultiSelectorList className="bg-white">
                      {availableProvinces.map((province) => (
                        <MultiSelectorItem
                          key={province}
                          value={province}
                          className="bg-white my-1"
                        >
                          {province}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
              </div>
              <div>
                <MultiSelector
                  values={filters.languages ?? []}
                  onValuesChange={(languagesNames) => {
                    onFiltersChange({ ...filters, languages: languagesNames });
                  }}
                >
                  <MultiSelectorTrigger>
                    <MultiSelectorInput placeholder="Seleccionar idioma" />
                  </MultiSelectorTrigger>
                  <MultiSelectorContent>
                    <MultiSelectorList className="bg-white">
                      {languages.map((language) => (
                        <MultiSelectorItem
                          key={language.name}
                          value={language.name}
                          className="bg-white my-1"
                        >
                          {language.name}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2 lg:gap-4">
              <div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      id="minAge"
                      type="number"
                      placeholder="Edad mínima"
                      className="rounded-xl border-brand-border bg-canvas focus:border-electric focus:ring-electric/10"
                      value={filters.minimumAge ?? ""}
                      onChange={(v) => {
                        onFiltersChange({
                          ...filters,
                          minimumAge:
                            v.target.value && v.target.value !== ""
                              ? parseInt(v.target.value)
                              : undefined,
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Input
                      id="maxAge"
                      type="number"
                      placeholder="Edad máxima"
                      className="rounded-xl border-brand-border bg-canvas focus:border-electric focus:ring-electric/10"
                      value={filters.maximumAge ?? ""}
                      onChange={(v) =>
                        onFiltersChange({
                          ...filters,
                          maximumAge:
                            v.target.value && v.target.value !== ""
                              ? parseInt(v.target.value)
                              : undefined,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4 col-span-2">
                <div className="flex items-center space-x-2 w-full">
                  <Checkbox
                    id="blacklist"
                    checked={filters.blacklisted}
                    onCheckedChange={(checked) =>
                      onFiltersChange({
                        ...filters,
                        blacklisted:
                          checked === "indeterminate" ? false : checked,
                      })
                    }
                  />
                  <Label
                    htmlFor="blacklist"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Incluir postulantes en blacklist
                  </Label>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="flex items-center rounded-xl border-brand-border text-slate-brand hover:text-ink hover:border-electric hover:bg-electric/5 transition-all"
                >
                  <RotateCcw className="h-4 w-4" />
                  {clearFilters ? "Reiniciar" : "Limpiar"}
                </Button>
                {clearFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="flex items-center rounded-xl border-brand-border text-slate-brand hover:text-ink hover:border-electric hover:bg-electric/5 transition-all"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Limpiar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      ) : (
        <div className="p-0" />
      )}
    </Card>
  );
}
