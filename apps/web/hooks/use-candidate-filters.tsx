import type { CandidateFilters, CandidateParams } from "@workspace/shared/types/candidate";
import { useFilters } from "./use-filters";

function transformFiltersToParams(filters?: CandidateFilters): CandidateParams {
  if (!filters) return {};
  const { industries, seniorities, areas, gender, ...rest } = filters;

  return {
    ...rest,
    gender: gender === "none" ? undefined : gender,
    seniorityIds: seniorities?.map((i) => i.id),
    industryIds: industries?.map((i) => i.id),
    areaIds: areas?.map((i) => i.id),
  };
}

interface Props {
  initialValues?: CandidateFilters;
  debounce?: number;
}

export function useCandidatesFilters(props?: Props) {
  return useFilters<CandidateFilters, CandidateParams>({
    initialValues: props?.initialValues,
    debounce: props?.debounce,
    transformFilters: transformFiltersToParams,
  });
}
