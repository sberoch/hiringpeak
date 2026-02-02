import { Badge } from "@workspace/ui/components/badge";

import { translateGender } from "@/lib/utils";
import type { Vacancy } from "@workspace/shared/types/vacancy";

interface VacancyDetailHeaderFiltersProps {
  vacancy: Vacancy;
}

export const VacancyDetailHeaderFilters = ({
  vacancy,
}: VacancyDetailHeaderFiltersProps) => {
  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
        {vacancy.filters.seniorities &&
          vacancy.filters.seniorities.length > 0 && (
            <div>
              <div className="text-gray-500">Seniority</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {vacancy.filters.seniorities.map((seniority) => (
                  <Badge
                    key={seniority.id}
                    variant="outline"
                    className="text-xs"
                  >
                    {seniority.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

        {vacancy.filters.areas && vacancy.filters.areas.length > 0 && (
          <div>
            <div className="text-gray-500">Áreas</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {vacancy.filters.areas.map((area) => (
                <Badge key={area.id} variant="outline" className="text-xs">
                  {area.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {vacancy.filters.industries &&
          vacancy.filters.industries.length > 0 && (
            <div>
              <div className="text-gray-500">Industrias</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {vacancy.filters.industries.map((industry) => (
                  <Badge
                    key={industry.id}
                    variant="outline"
                    className="text-xs"
                  >
                    {industry.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

        {vacancy.filters.minStars !== undefined &&
          vacancy.filters.minStars !== null && (
            <div>
              <div className="text-gray-500">Rating mínimo</div>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="outline" className="text-xs">
                  {"⭐".repeat(vacancy.filters.minStars)}
                </Badge>
              </div>
            </div>
          )}

        {((vacancy.filters.minAge !== undefined &&
          vacancy.filters.minAge !== null) ||
          (vacancy.filters.maxAge !== undefined &&
            vacancy.filters.maxAge !== null)) && (
            <div>
              <div className="text-gray-500">Rango de edad</div>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="outline" className="text-xs">
                  {vacancy.filters.minAge !== undefined
                    ? vacancy.filters.minAge
                    : ""}
                  {vacancy.filters.minAge !== undefined &&
                    vacancy.filters.maxAge !== undefined
                    ? " - "
                    : ""}
                  {vacancy.filters.maxAge !== undefined
                    ? vacancy.filters.maxAge
                    : ""}{" "}
                  años
                </Badge>
              </div>
            </div>
          )}

        {vacancy.filters.gender &&
          vacancy.filters.gender !== null &&
          vacancy.filters.gender !== "none" && (
            <div>
              <div className="text-gray-500">Género</div>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="outline" className="text-xs">
                  {translateGender(vacancy.filters.gender)}
                </Badge>
              </div>
            </div>
          )}

        {vacancy.filters.countries && vacancy.filters.countries.length > 0 && (
          <div>
            <div className="text-gray-500">País(es)</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {vacancy.filters.countries.map((country, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {country}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {vacancy.filters.provinces && vacancy.filters.provinces.length > 0 && (
          <div>
            <div className="text-gray-500">Provincia(s)</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {vacancy.filters.provinces.map((province, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {province}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {vacancy.filters.languages && vacancy.filters.languages.length > 0 && (
          <div>
            <div className="text-gray-500">Idioma(s)</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {vacancy.filters.languages.map((language, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {language}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
