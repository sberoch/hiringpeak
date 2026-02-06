import type { VacancyFiltersType, VacancyParams } from "@workspace/shared/types/vacancy";
import { useFilters } from "./use-filters";

function transformFiltersToParams(filters?: VacancyFiltersType): VacancyParams {
  if (!filters) return {};

  const {
    status,
    company,
    seniorities,
    industries,
    areas,
    countries,
    provinces,
    languages,
    createdBy,
    assignedTo,
    minStars,
    gender,
    minAge,
    maxAge,
    ...rest
  } = filters;
  return {
    ...rest,
    statusId: status?.id,
    companyId: company?.id,
    filterCountries: countries,
    filterProvinces: provinces,
    filterLanguages: languages,
    filterSeniorityIds: seniorities?.map((s) => s.id),
    filterIndustryIds: industries?.map((i) => i.id),
    filterAreaIds: areas?.map((a) => a.id),
    createdById: createdBy,
    assignedToId: assignedTo,
    filterMinStars: minStars,
    filterGender: gender,
    filterMinAge: minAge,
    filterMaxAge: maxAge,
  };
}

interface Props {
  initialValues?: VacancyFiltersType;
  debounce?: number;
}

export function useVacancyFilters(props?: Props) {
  return useFilters<VacancyFiltersType, VacancyParams>({
    initialValues: props?.initialValues,
    debounce: props?.debounce,
    transformFilters: transformFiltersToParams,
  });
}
