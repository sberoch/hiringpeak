"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
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

  return (
    <Card className="rounded-2xl border-brand-border bg-surface">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-ink">
          Filtros sugeridos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <MultiSelector
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
            <MultiSelectorTrigger>
              <MultiSelectorInput placeholder="Seleccionar seniority" />
            </MultiSelectorTrigger>
            <MultiSelectorContent>
              <MultiSelectorList className="bg-white">
                {senioritiesData?.items.map((seniority) => (
                  <MultiSelectorItem
                    key={seniority.id}
                    value={seniority.name}
                    className="my-1 bg-white"
                  >
                    {seniority.name}
                  </MultiSelectorItem>
                ))}
              </MultiSelectorList>
            </MultiSelectorContent>
          </MultiSelector>

          <MultiSelector
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
            <MultiSelectorTrigger>
              <MultiSelectorInput placeholder="Seleccionar área" />
            </MultiSelectorTrigger>
            <MultiSelectorContent>
              <MultiSelectorList className="bg-white">
                {areasData?.items.map((area) => (
                  <MultiSelectorItem
                    key={area.id}
                    value={area.name}
                    className="my-1 bg-white"
                  >
                    {area.name}
                  </MultiSelectorItem>
                ))}
              </MultiSelectorList>
            </MultiSelectorContent>
          </MultiSelector>

          <MultiSelector
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
            <MultiSelectorTrigger>
              <MultiSelectorInput placeholder="Seleccionar industria" />
            </MultiSelectorTrigger>
            <MultiSelectorContent>
              <MultiSelectorList className="bg-white">
                {industriesData?.items.map((industry) => (
                  <MultiSelectorItem
                    key={industry.id}
                    value={industry.name}
                    className="my-1 bg-white"
                  >
                    {industry.name}
                  </MultiSelectorItem>
                ))}
              </MultiSelectorList>
            </MultiSelectorContent>
          </MultiSelector>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Input
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
            <SelectTrigger>
              <SelectValue placeholder="Sin preferencia de género" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Masculino</SelectItem>
              <SelectItem value="female">Femenino</SelectItem>
              <SelectItem value="other">Otro</SelectItem>
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
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

        <div className="grid gap-3 md:grid-cols-3">
          <MultiSelector
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
            <MultiSelectorTrigger>
              <MultiSelectorInput placeholder="Seleccionar país" />
            </MultiSelectorTrigger>
            <MultiSelectorContent>
              <MultiSelectorList className="bg-white">
                {countries.map((country) => (
                  <MultiSelectorItem
                    key={country.code}
                    value={country.name}
                    className="my-1 bg-white"
                  >
                    {country.name}
                  </MultiSelectorItem>
                ))}
              </MultiSelectorList>
            </MultiSelectorContent>
          </MultiSelector>

          <MultiSelector
            values={filters.provinces ?? []}
            onValuesChange={(names) => {
              onChange({
                ...filters,
                provinces: names.length > 0 ? names : undefined,
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
                    className="my-1 bg-white"
                  >
                    {province}
                  </MultiSelectorItem>
                ))}
              </MultiSelectorList>
            </MultiSelectorContent>
          </MultiSelector>

          <MultiSelector
            values={filters.languages ?? []}
            onValuesChange={(names) => {
              onChange({
                ...filters,
                languages: names.length > 0 ? names : undefined,
              });
            }}
          >
            <MultiSelectorTrigger>
              <MultiSelectorInput placeholder="Seleccionar idioma" />
            </MultiSelectorTrigger>
            <MultiSelectorContent>
              <MultiSelectorList className="bg-white">
                {languages.map((language) => (
                  <MultiSelectorItem
                    key={language.code}
                    value={language.name}
                    className="my-1 bg-white"
                  >
                    {language.name}
                  </MultiSelectorItem>
                ))}
              </MultiSelectorList>
            </MultiSelectorContent>
          </MultiSelector>
        </div>
      </CardContent>
    </Card>
  );
}

