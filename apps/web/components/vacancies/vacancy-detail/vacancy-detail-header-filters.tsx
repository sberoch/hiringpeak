import { Filter } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";

import { translateGender } from "@/lib/utils";
import type { Vacancy } from "@workspace/shared/types/vacancy";

const filterBadgeCn =
  "text-xs bg-electric/5 text-electric border-electric/20 rounded-lg";

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-muted-brand text-xs font-medium mb-1.5">
        {label}
      </div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

interface VacancyDetailHeaderFiltersProps {
  vacancy: Vacancy;
}

export const VacancyDetailHeaderFilters = ({
  vacancy,
}: VacancyDetailHeaderFiltersProps) => {
  const f = vacancy.filters;
  const hasFilters =
    !!f.seniorities?.length ||
    !!f.areas?.length ||
    !!f.industries?.length ||
    f.minStars != null ||
    f.minAge != null ||
    f.maxAge != null ||
    (!!f.gender && f.gender !== "none") ||
    !!f.countries?.length ||
    !!f.provinces?.length ||
    !!f.languages?.length;

  if (!hasFilters) return null;

  return (
    <div className="rounded-2xl border border-brand-border bg-surface p-6 col-span-1 lg:col-span-3">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-electric/10 text-electric">
          <Filter className="h-3.5 w-3.5" />
        </div>
        <h3 className="text-sm font-semibold text-ink">
          Filtros de la búsqueda
        </h3>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
        {!!f.seniorities?.length && (
          <FilterSection label="Seniority">
            {f.seniorities.map((seniority) => (
              <Badge key={seniority.id} variant="outline" className={filterBadgeCn}>
                {seniority.name}
              </Badge>
            ))}
          </FilterSection>
        )}

        {!!f.areas?.length && (
          <FilterSection label="Áreas">
            {f.areas.map((area) => (
              <Badge key={area.id} variant="outline" className={filterBadgeCn}>
                {area.name}
              </Badge>
            ))}
          </FilterSection>
        )}

        {!!f.industries?.length && (
          <FilterSection label="Industrias">
            {f.industries.map((industry) => (
              <Badge key={industry.id} variant="outline" className={filterBadgeCn}>
                {industry.name}
              </Badge>
            ))}
          </FilterSection>
        )}

        {f.minStars != null && (
          <FilterSection label="Rating mínimo">
            <Badge variant="outline" className={filterBadgeCn}>
              {"⭐".repeat(f.minStars)}
            </Badge>
          </FilterSection>
        )}

        {(f.minAge != null || f.maxAge != null) && (
          <FilterSection label="Rango de edad">
            <Badge variant="outline" className={filterBadgeCn}>
              {f.minAge != null ? f.minAge : ""}
              {f.minAge != null && f.maxAge != null ? " - " : ""}
              {f.maxAge != null ? f.maxAge : ""} años
            </Badge>
          </FilterSection>
        )}

        {!!f.gender && f.gender !== "none" && (
          <FilterSection label="Género">
            <Badge variant="outline" className={filterBadgeCn}>
              {translateGender(f.gender)}
            </Badge>
          </FilterSection>
        )}

        {!!f.countries?.length && (
          <FilterSection label="País(es)">
            {f.countries.map((country, index) => (
              <Badge key={index} variant="outline" className={filterBadgeCn}>
                {country}
              </Badge>
            ))}
          </FilterSection>
        )}

        {!!f.provinces?.length && (
          <FilterSection label="Provincia(s)">
            {f.provinces.map((province, index) => (
              <Badge key={index} variant="outline" className={filterBadgeCn}>
                {province}
              </Badge>
            ))}
          </FilterSection>
        )}

        {!!f.languages?.length && (
          <FilterSection label="Idioma(s)">
            {f.languages.map((language, index) => (
              <Badge key={index} variant="outline" className={filterBadgeCn}>
                {language}
              </Badge>
            ))}
          </FilterSection>
        )}
      </div>
    </div>
  );
};
