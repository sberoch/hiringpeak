import type { AuthTokenData } from "@workspace/shared/types/auth";
import type {
  Candidate,
  CandidateFilters,
  CandidateParams,
} from "@workspace/shared/types/candidate";
import type {
  CandidateVacancy,
  Vacancy,
  VacancyFiltersType,
} from "@workspace/shared/types/vacancy";
import type { SortingState } from "@tanstack/react-table";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

export const normalizeString = (str: string) => {
  return str
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

export function parseJwt(token: string): AuthTokenData {
  return JSON.parse(
    Buffer.from(token.split(".")[1] ?? "", "base64").toString(),
  ) as AuthTokenData;
}

export function candidateVacancyFiltersAdapter(
  vacancyF?: VacancyFiltersType,
): CandidateFilters {
  if (!vacancyF) return {};
  return {
    seniorities:
      vacancyF.seniorities && vacancyF.seniorities.length > 0
        ? vacancyF.seniorities
        : undefined,
    areas:
      vacancyF.areas && vacancyF.areas.length > 0 ? vacancyF.areas : undefined,
    industries:
      vacancyF.industries && vacancyF.industries.length > 0
        ? vacancyF.industries
        : undefined,
    minimumStars: vacancyF.minStars ?? undefined,
    gender: vacancyF.gender === "none" ? undefined : vacancyF.gender,
    minimumAge: vacancyF.minAge ?? undefined,
    maximumAge: vacancyF.maxAge ?? undefined,
    countries:
      vacancyF.countries && vacancyF.countries.length > 0
        ? vacancyF.countries
        : undefined,
    provinces:
      vacancyF.provinces && vacancyF.provinces.length > 0
        ? vacancyF.provinces
        : undefined,
    languages:
      vacancyF.languages && vacancyF.languages.length > 0
        ? vacancyF.languages
        : undefined,
  };
}

export function vacancyDisplayLabel(vacancy: Vacancy): string {
  return vacancy.title;
}

const tailwindColors = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "zinc",
  "stone",
];

const colorRGBMap: Record<string, string> = {
  red: "rgb(254, 202, 202)",
  orange: "rgb(253, 186, 116)",
  amber: "rgb(253, 230, 138)",
  yellow: "rgb(254, 240, 138)",
  lime: "rgb(217, 249, 157)",
  green: "rgb(187, 247, 208)",
  emerald: "rgb(167, 243, 208)",
  teal: "rgb(153, 246, 228)",
  cyan: "rgb(165, 243, 252)",
  sky: "rgb(186, 230, 253)",
  blue: "rgb(191, 219, 254)",
  indigo: "rgb(199, 210, 254)",
  violet: "rgb(221, 214, 254)",
  purple: "rgb(233, 213, 255)",
  fuchsia: "rgb(250, 232, 255)",
  pink: "rgb(251, 207, 232)",
  rose: "rgb(254, 205, 211)",
  zinc: "rgb(228, 228, 231)",
  stone: "rgb(231, 229, 228)",
};

export function stringToColor(str: string): string {
  if (!str) return "gray";
  const hash = str.split("").reduce((acc, char, index) => {
    return char.charCodeAt(0) + ((acc << 5) - acc) + index * str.length;
  }, 0);

  const colorIndex = Math.abs(hash) % tailwindColors.length;
  const color = tailwindColors[colorIndex] ?? "gray";

  return colorRGBMap[color] ?? "rgb(231, 229, 228)";
}

export const CANDIDATE_STATUS_COLORS = [
  { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
  { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500" },
  { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
];

export function getCandidateStatusColor(index: number) {
  return CANDIDATE_STATUS_COLORS[index % CANDIDATE_STATUS_COLORS.length]!;
}

export function getColumnGradientColor(
  index: number,
  totalColumns: number,
): string {
  if (totalColumns <= 1) {
    return "rgba(34, 197, 94, 0.3)";
  }

  const position = index / (totalColumns - 1);

  let r: number, g: number, b: number;

  if (position <= 0.5) {
    const localPosition = position * 2;
    r = 220;
    g = Math.round(50 + 200 * localPosition);
    b = 50;
  } else {
    const localPosition = (position - 0.5) * 2;
    r = Math.round(220 - 186 * localPosition);
    g = Math.round(250 - 53 * localPosition);
    b = Math.round(50 + 44 * localPosition);
  }

  return `rgba(${r}, ${g}, ${b}, 0.3)`;
}

type FilterRecord = Record<
  string,
  | string
  | number
  | boolean
  | undefined
  | Array<string | number | boolean>
  | null
>;

export function filtersToSearchParams(filters: FilterRecord): string {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value) && value.length === 0) return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") {
          searchParams.append(key, item.toString());
        }
      });
    } else {
      searchParams.append(key, value.toString());
    }
  });

  if (searchParams.toString() === "") {
    return "";
  }

  return `?${searchParams.toString()}`;
}

export function sortingToTanstack(sort?: string): SortingState {
  const splited = sort?.split(":");
  if (!sort || !splited || splited?.length <= 1) {
    return [];
  }

  return [{ id: splited[0] ?? "", desc: (splited[1] ?? "") === "desc" }];
}

export function vacancyFilterToCandidateFilter(
  vacancyFilter?: VacancyFiltersType,
): CandidateParams {
  if (!vacancyFilter) return {};

  const { areas, industries, seniorities, gender } = vacancyFilter;
  return {
    gender: gender === "none" ? undefined : gender,
    minimumAge: vacancyFilter.minAge,
    maximumAge: vacancyFilter.maxAge,
    minimumStars: vacancyFilter.minStars,
    areaIds: areas?.map((a) => a.id),
    industryIds: industries?.map((i) => i.id),
    seniorityIds: seniorities?.map((i) => i.id),
    countries: vacancyFilter.countries,
    provinces: vacancyFilter.provinces,
    languages: vacancyFilter.languages,
  };
}

export function translateGender(gender: string): string {
  if (gender === "male") return "Masculino";
  if (gender === "female") return "Femenino";
  if (gender === "other") return "Otro";
  if (gender === "none") return "No especificado";
  return gender;
}

export const CATALOG_TYPE_COLORS = {
  seniority: "bg-violet-100 text-violet-700",
  area: "bg-sky-100 text-sky-700",
  industry: "bg-amber-100 text-amber-700",
} as const;

export type CatalogTagType = keyof typeof CATALOG_TYPE_COLORS;

export type CatalogTag = { label: string; type: CatalogTagType };

export function getVacancyFilterTags(
  filters?: VacancyFiltersType,
): CatalogTag[] {
  const tags: CatalogTag[] = [];
  if (filters?.seniorities) {
    filters.seniorities.forEach((s) =>
      tags.push({ label: s.name, type: "seniority" }),
    );
  }
  if (filters?.areas) {
    filters.areas.forEach((a) =>
      tags.push({ label: a.name, type: "area" }),
    );
  }
  if (filters?.industries) {
    filters.industries.forEach((i) =>
      tags.push({ label: i.name, type: "industry" }),
    );
  }
  return tags;
}

export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return age;
}

export function mergeCandidatesWithVacancies(
  candidates: Candidate[],
  candidateVacancies: CandidateVacancy[],
): Candidate[] {
  return candidates.map((candidate) => {
    const candidateVacancyRelations = candidateVacancies.filter(
      (cv) => cv.candidate.id === candidate.id,
    );

    const vacancies = candidateVacancyRelations.map((cv) => cv.vacancy);

    return {
      ...candidate,
      vacancies,
    };
  });
}
