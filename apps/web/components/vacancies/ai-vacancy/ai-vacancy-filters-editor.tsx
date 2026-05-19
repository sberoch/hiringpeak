"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";

import { Input } from "@workspace/ui/components/input";
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
  provinceGroups,
} from "@workspace/shared/static/catalogs";
import type { AiVacancyDraftFilters } from "@workspace/shared/types/vacancy-ai";
import { AiVacancySection, fieldClassName } from "./ai-vacancy-section";

interface AiVacancyFiltersEditorProps {
  filters: AiVacancyDraftFilters;
  onChange: (filters: AiVacancyDraftFilters) => void;
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function parseNumericInput(value: string) {
  if (value.trim().length === 0) {
    return undefined;
  }

  return Number(value);
}

export function AiVacancyFiltersEditor({
  filters,
  onChange,
}: AiVacancyFiltersEditorProps) {
  const { data: industriesData } = useQuery({
    queryKey: [INDUSTRIES_API_KEY, { page: 1, limit: 1e9 }],
    queryFn: () => getAllIndustries({ page: 1, limit: 1e9 }),
  });

  const { data: senioritiesData } = useQuery({
    queryKey: [SENIORITY_API_KEY, { page: 1, limit: 1e9 }],
    queryFn: () => getAllSeniorities({ page: 1, limit: 1e9 }),
  });

  const { data: areasData } = useQuery({
    queryKey: [AREAS_API_KEY, { page: 1, limit: 1e9 }],
    queryFn: () => getAllAreas({ page: 1, limit: 1e9 }),
  });

  const availableProvinces = useMemo(() => {
    const selectedCountries = filters.countries ?? [];

    if (selectedCountries.length === 0) {
      return [];
    }

    return provinceGroups
      .filter((group) => selectedCountries.includes(group.country))
      .flatMap((group) => group.provinces);
  }, [filters.countries]);

  const filterGridClass =
    "@container min-w-0 grid grid-cols-1 gap-3 @sm:grid-cols-2 @lg:grid-cols-3";

  return (
    <AiVacancySection
      icon={SlidersHorizontal}
      title="Filtros sugeridos"
      description="Ajustá el universo de candidatos; los cambios actualizan la vista automáticamente."
      className="border-b border-brand-border"
    >
      <div className="space-y-4">
        <div className={filterGridClass}>
          <MultiSelector
            className="min-w-0"
            values={
              (filters.seniorityIds ?? [])
                .map((id) =>
                  senioritiesData?.items.find((item) => item.id === id)?.name,
                )
                .filter(isDefined)
            }
            onValuesChange={(names) => {
              const nextValues = senioritiesData?.items
                .filter((item) => names.includes(item.name))
                .map((item) => item.id);

              onChange({
                ...filters,
                seniorityIds: nextValues && nextValues.length > 0 ? nextValues : undefined,
              });
            }}
          >
            <MultiSelectorTrigger className={`min-w-0 ${fieldClassName}`}>
              <MultiSelectorInput placeholder="Seleccionar seniority" />
            </MultiSelectorTrigger>
            <MultiSelectorContent>
              <MultiSelectorList className="bg-surface">
                {senioritiesData?.items.map((seniority) => (
                  <MultiSelectorItem key={seniority.id} value={seniority.name}>
                    {seniority.name}
                  </MultiSelectorItem>
                ))}
              </MultiSelectorList>
            </MultiSelectorContent>
          </MultiSelector>

          <MultiSelector
            className="min-w-0"
            values={
              (filters.areaIds ?? [])
                .map((id) => areasData?.items.find((item) => item.id === id)?.name)
                .filter(isDefined)
            }
            onValuesChange={(names) => {
              const nextValues = areasData?.items
                .filter((item) => names.includes(item.name))
                .map((item) => item.id);

              onChange({
                ...filters,
                areaIds: nextValues && nextValues.length > 0 ? nextValues : undefined,
              });
            }}
          >
            <MultiSelectorTrigger className={`min-w-0 ${fieldClassName}`}>
              <MultiSelectorInput placeholder="Seleccionar área" />
            </MultiSelectorTrigger>
            <MultiSelectorContent>
              <MultiSelectorList className="bg-surface">
                {areasData?.items.map((area) => (
                  <MultiSelectorItem key={area.id} value={area.name}>
                    {area.name}
                  </MultiSelectorItem>
                ))}
              </MultiSelectorList>
            </MultiSelectorContent>
          </MultiSelector>

          <MultiSelector
            className="min-w-0"
            values={
              (filters.industryIds ?? [])
                .map((id) =>
                  industriesData?.items.find((item) => item.id === id)?.name,
                )
                .filter(isDefined)
            }
            onValuesChange={(names) => {
              const nextValues = industriesData?.items
                .filter((item) => names.includes(item.name))
                .map((item) => item.id);

              onChange({
                ...filters,
                industryIds: nextValues && nextValues.length > 0 ? nextValues : undefined,
              });
            }}
          >
            <MultiSelectorTrigger className={`min-w-0 ${fieldClassName}`}>
              <MultiSelectorInput placeholder="Seleccionar industria" />
            </MultiSelectorTrigger>
            <MultiSelectorContent>
              <MultiSelectorList className="bg-surface">
                {industriesData?.items.map((industry) => (
                  <MultiSelectorItem key={industry.id} value={industry.name}>
                    {industry.name}
                  </MultiSelectorItem>
                ))}
              </MultiSelectorList>
            </MultiSelectorContent>
          </MultiSelector>
        </div>

        <div className={filterGridClass}>
          <Input
            className={`min-w-0 ${fieldClassName}`}
            type="number"
            min="0"
            max="5"
            step="0.5"
            placeholder="Rating mínimo"
            value={filters.minStars ?? ""}
            onChange={(event) => {
              onChange({
                ...filters,
                minStars: parseNumericInput(event.target.value),
              });
            }}
          />

          <Select
            value={filters.gender ?? ""}
            onValueChange={(value) => {
              onChange({
                ...filters,
                gender: value.length > 0 ? value : undefined,
              });
            }}
          >
            <SelectTrigger className={`min-w-0 w-full ${fieldClassName}`}>
              <SelectValue placeholder="Sin preferencia de género" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Masculino</SelectItem>
              <SelectItem value="female">Femenino</SelectItem>
              <SelectItem value="other">Otro</SelectItem>
            </SelectContent>
          </Select>

          <div className="grid min-w-0 grid-cols-2 gap-3">
            <Input
              className={`min-w-0 ${fieldClassName}`}
              type="number"
              min="18"
              placeholder="Edad mín."
              value={filters.minAge ?? ""}
              onChange={(event) => {
                onChange({
                  ...filters,
                  minAge: parseNumericInput(event.target.value),
                });
              }}
            />
            <Input
              className={`min-w-0 ${fieldClassName}`}
              type="number"
              min="18"
              placeholder="Edad máx."
              value={filters.maxAge ?? ""}
              onChange={(event) => {
                onChange({
                  ...filters,
                  maxAge: parseNumericInput(event.target.value),
                });
              }}
            />
          </div>
        </div>

        <div className={filterGridClass}>
          <MultiSelector
            className="min-w-0"
            values={filters.countries ?? []}
            onValuesChange={(names) => {
              const nextAvailableProvinces = provinceGroups
                .filter((group) => names.includes(group.country))
                .flatMap((group) => group.provinces);
              const nextProvinces = (filters.provinces ?? []).filter((province) =>
                nextAvailableProvinces.includes(province),
              );

              onChange({
                ...filters,
                countries: names.length > 0 ? names : undefined,
                provinces: nextProvinces.length > 0 ? nextProvinces : undefined,
              });
            }}
          >
            <MultiSelectorTrigger className={`min-w-0 ${fieldClassName}`}>
              <MultiSelectorInput placeholder="Seleccionar país" />
            </MultiSelectorTrigger>
            <MultiSelectorContent>
              <MultiSelectorList className="bg-surface">
                {countries.map((country) => (
                  <MultiSelectorItem key={country.code} value={country.name}>
                    {country.name}
                  </MultiSelectorItem>
                ))}
              </MultiSelectorList>
            </MultiSelectorContent>
          </MultiSelector>

          <MultiSelector
            className="min-w-0"
            values={filters.provinces ?? []}
            onValuesChange={(names) => {
              onChange({
                ...filters,
                provinces: names.length > 0 ? names : undefined,
              });
            }}
          >
            <MultiSelectorTrigger className={`min-w-0 ${fieldClassName}`}>
              <MultiSelectorInput placeholder="Seleccionar provincia" />
            </MultiSelectorTrigger>
            <MultiSelectorContent>
              <MultiSelectorList className="bg-surface">
                {availableProvinces.map((province) => (
                  <MultiSelectorItem key={province} value={province}>
                    {province}
                  </MultiSelectorItem>
                ))}
              </MultiSelectorList>
            </MultiSelectorContent>
          </MultiSelector>

          <MultiSelector
            className="min-w-0"
            values={filters.languages ?? []}
            onValuesChange={(names) => {
              onChange({
                ...filters,
                languages: names.length > 0 ? names : undefined,
              });
            }}
          >
            <MultiSelectorTrigger className={`min-w-0 ${fieldClassName}`}>
              <MultiSelectorInput placeholder="Seleccionar idioma" />
            </MultiSelectorTrigger>
            <MultiSelectorContent>
              <MultiSelectorList className="bg-surface">
                {languages.map((language) => (
                  <MultiSelectorItem key={language.code} value={language.name}>
                    {language.name}
                  </MultiSelectorItem>
                ))}
              </MultiSelectorList>
            </MultiSelectorContent>
          </MultiSelector>
        </div>
      </div>
    </AiVacancySection>
  );
}
