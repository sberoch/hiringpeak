import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";

import { vacancyDisplayLabel } from "@/lib/utils";
import type { Vacancy } from "@workspace/shared/types/vacancy";

interface VacancyFiltersCardProps {
  vacancy: Vacancy;
}

export const VacancyFiltersCard = ({ vacancy }: VacancyFiltersCardProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{vacancyDisplayLabel(vacancy)}</CardTitle>
        {vacancy.description && (
          <p className="text-sm text-zinc-500 mt-2">{vacancy.description}</p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col items-start">
            <span className="text-xs text-zinc-500 mb-1">Creado por</span>
            <Badge variant="outline">{vacancy.createdBy.name}</Badge>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs text-zinc-500 mb-1">Asignado a</span>
            <Badge variant="outline">{vacancy.assignedTo.name}</Badge>
          </div>
          {vacancy.company && (
            <div className="flex flex-col items-start">
              <span className="text-xs text-zinc-500 mb-1">Empresa</span>
              <Badge variant="outline">{vacancy.company.name}</Badge>
            </div>
          )}

          {vacancy.filters?.seniorities &&
            vacancy.filters.seniorities.length > 0 && (
              <div className="flex flex-col items-start">
                <span className="text-xs text-zinc-500 mb-1">Seniority</span>
                <div className="flex flex-wrap gap-1">
                  {vacancy.filters.seniorities.map((seniority) => (
                    <Badge key={seniority.id} variant="secondary">
                      {seniority.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

          {vacancy.filters?.areas && vacancy.filters.areas.length > 0 && (
            <div className="flex flex-col items-start">
              <span className="text-xs text-zinc-500 mb-1">Área</span>
              <div className="flex flex-wrap gap-1">
                {vacancy.filters.areas.map((area) => (
                  <Badge key={area.id} variant="secondary">
                    {area.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {vacancy.filters?.industries &&
            vacancy.filters.industries.length > 0 && (
              <div className="flex flex-col items-start">
                <span className="text-xs text-zinc-500 mb-1">Industria</span>
                <div className="flex flex-wrap gap-1">
                  {vacancy.filters.industries.map((industry) => (
                    <Badge key={industry.id} variant="secondary">
                      {industry.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

          {(vacancy.filters?.minAge || vacancy.filters?.maxAge) && (
            <div className="flex flex-col items-start">
              <span className="text-xs text-zinc-500 mb-1">Edad</span>
              <Badge variant="secondary">
                {vacancy.filters.minAge && vacancy.filters.maxAge
                  ? `${vacancy.filters.minAge} - ${vacancy.filters.maxAge} años`
                  : vacancy.filters.minAge
                    ? `Desde ${vacancy.filters.minAge} años`
                    : `Hasta ${vacancy.filters.maxAge} años`}
              </Badge>
            </div>
          )}

          {vacancy.filters?.minStars && (
            <div className="flex flex-col items-start">
              <span className="text-xs text-zinc-500 mb-1">
                Valoración mínima
              </span>
              <Badge variant="secondary">
                {vacancy.filters.minStars} estrellas
              </Badge>
            </div>
          )}

          {vacancy.filters?.countries &&
            vacancy.filters.countries.length > 0 && (
              <div className="flex flex-col items-start">
                <span className="text-xs text-zinc-500 mb-1">Pais(es)</span>
                <Badge variant="secondary">
                  {vacancy.filters.countries.join(", ")}
                </Badge>
              </div>
            )}

          {vacancy.filters?.provinces &&
            vacancy.filters.provinces.length > 0 && (
              <div className="flex flex-col items-start">
                <span className="text-xs text-zinc-500 mb-1">
                  Provincia(s)
                </span>
                <Badge variant="secondary">
                  {vacancy.filters.provinces.join(", ")}
                </Badge>
              </div>
            )}

          {vacancy.filters?.languages &&
            vacancy.filters.languages.length > 0 && (
              <div className="flex flex-col items-start">
                <span className="text-xs text-zinc-500 mb-1">Idioma(s)</span>
                <Badge variant="secondary">
                  {vacancy.filters.languages.join(", ")}
                </Badge>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
};
