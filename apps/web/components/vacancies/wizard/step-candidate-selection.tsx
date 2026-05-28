"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Filter } from "lucide-react";

import {
  CandidatePicker,
  CandidatePickerSkeleton,
} from "@/components/vacancies/candidate-picker";
import { CatalogBadge } from "@/components/ui/catalog-badge";
import { Badge } from "@workspace/ui/components/badge";
import { CANDIDATE_API_KEY, getAllCandidates } from "@/lib/api/candidate";
import { candidateVacancyFiltersAdapter, translateGender } from "@/lib/utils";
import type { VacancyFiltersType } from "@workspace/shared/types/vacancy";

interface StepCandidateSelectionProps {
  vacancyFilters: VacancyFiltersType;
  existingCandidateIds?: number[];
  selectionKey: string;
  selectedCandidates: number[];
  onChangeSelected: (next: number[]) => void;
  onInitialized: (initial: number[]) => void;
}

const filterBadgeCn =
  "text-xs bg-electric/5 text-electric border-electric/20 rounded-lg";

function hasAnyFilter(f: VacancyFiltersType | undefined) {
  if (!f) return false;
  return (
    !!f.seniorities?.length ||
    !!f.areas?.length ||
    !!f.industries?.length ||
    f.minStars != null ||
    f.minAge != null ||
    f.maxAge != null ||
    (!!f.gender && f.gender !== "none") ||
    !!f.countries?.length ||
    !!f.provinces?.length ||
    !!f.languages?.length
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span className="text-xs font-medium text-muted-brand">{label}:</span>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

function VacancyBrief({
  filters,
}: {
  filters: VacancyFiltersType | undefined;
}) {
  const f = filters ?? ({} as VacancyFiltersType);
  const hasFilters = hasAnyFilter(f);

  return (
    <div className="rounded-2xl border border-brand-border bg-surface px-5 py-3.5">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-electric/10 text-electric">
            <Filter className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-semibold text-ink">Perfil buscado</h3>
        </div>

        {!hasFilters ? (
          <p className="text-xs text-muted-brand italic self-center">
            Sin filtros — se muestran todos los postulantes.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm flex-1">
            {!!f.seniorities?.length && (
              <FilterRow label="Seniority">
                {f.seniorities.map((s) => (
                  <CatalogBadge key={s.id} label={s.name} type="seniority" />
                ))}
              </FilterRow>
            )}
            {!!f.areas?.length && (
              <FilterRow label="Áreas">
                {f.areas.map((a) => (
                  <CatalogBadge key={a.id} label={a.name} type="area" />
                ))}
              </FilterRow>
            )}
            {!!f.industries?.length && (
              <FilterRow label="Industrias">
                {f.industries.map((i) => (
                  <CatalogBadge key={i.id} label={i.name} type="industry" />
                ))}
              </FilterRow>
            )}
            {f.minStars != null && (
              <FilterRow label="Rating mínimo">
                <Badge variant="outline" className={filterBadgeCn}>
                  {`${f.minStars}/5`}
                </Badge>
              </FilterRow>
            )}
            {(f.minAge != null || f.maxAge != null) && (
              <FilterRow label="Rango de edad">
                <Badge variant="outline" className={filterBadgeCn}>
                  {f.minAge != null ? f.minAge : ""}
                  {f.minAge != null && f.maxAge != null ? " - " : ""}
                  {f.maxAge != null ? f.maxAge : ""} años
                </Badge>
              </FilterRow>
            )}
            {!!f.gender && f.gender !== "none" && (
              <FilterRow label="Género">
                <Badge variant="outline" className={filterBadgeCn}>
                  {translateGender(f.gender)}
                </Badge>
              </FilterRow>
            )}
            {!!f.countries?.length && (
              <FilterRow label="País(es)">
                {f.countries.map((country, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className={filterBadgeCn}
                  >
                    {country}
                  </Badge>
                ))}
              </FilterRow>
            )}
            {!!f.provinces?.length && (
              <FilterRow label="Provincia(s)">
                {f.provinces.map((province, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className={filterBadgeCn}
                  >
                    {province}
                  </Badge>
                ))}
              </FilterRow>
            )}
            {!!f.languages?.length && (
              <FilterRow label="Idioma(s)">
                {f.languages.map((language, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className={filterBadgeCn}
                  >
                    {language}
                  </Badge>
                ))}
              </FilterRow>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function StepCandidateSelection({
  vacancyFilters,
  existingCandidateIds = [],
  selectionKey,
  selectedCandidates,
  onChangeSelected,
  onInitialized,
}: StepCandidateSelectionProps) {
  const filterParams = vacancyFilters
    ? {
        ...candidateVacancyFiltersAdapter(vacancyFilters),
        limit: 1e9,
        page: 1,
      }
    : { limit: 1e9, page: 1 };

  const { data: candidates, isLoading: candidatesLoading } = useQuery({
    queryKey: [CANDIDATE_API_KEY, filterParams],
    queryFn: () => getAllCandidates(filterParams),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (!candidates?.items) return;
    const filteredCandidateIds = candidates.items.map((c) => c.id);
    const existingInFiltered = existingCandidateIds.filter((id) =>
      filteredCandidateIds.includes(id),
    );
    onChangeSelected(existingInFiltered);
    onInitialized(existingInFiltered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates?.items, selectionKey]);

  const toggleCandidateSelection = (candidateId: number) => {
    onChangeSelected(
      selectedCandidates.includes(candidateId)
        ? selectedCandidates.filter((id) => id !== candidateId)
        : [...selectedCandidates, candidateId],
    );
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-brand">
        Seleccioná los postulantes que querés sumar a esta vacante.
        {existingCandidateIds.length > 0
          ? " Los que ya están asignados aparecen marcados."
          : null}
      </p>

      <VacancyBrief filters={vacancyFilters} />

      {candidatesLoading ? (
        <CandidatePickerSkeleton />
      ) : (
        <CandidatePicker
          candidates={candidates?.items ?? []}
          selectedCandidates={selectedCandidates}
          toggleCandidateSelection={toggleCandidateSelection}
        />
      )}
    </div>
  );
}
