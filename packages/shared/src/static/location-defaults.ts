import { provinceGroups } from "./catalogs";

const SPANISH_SPEAKING_COUNTRIES = [
  "Argentina",
  "Bolivia",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Cuba",
  "Ecuador",
  "El Salvador",
  "España",
  "Guatemala",
  "Guinea Ecuatorial",
  "Honduras",
  "México",
  "Nicaragua",
  "Panamá",
  "Paraguay",
  "Perú",
  "Puerto Rico",
  "República Dominicana",
  "Uruguay",
  "Venezuela",
] as const;

const COUNTRY_DEFAULT_LANGUAGE: Record<string, string> = {
  ...Object.fromEntries(
    SPANISH_SPEAKING_COUNTRIES.map((country) => [country, "Español"]),
  ),
  Brasil: "Portugués",
};

let provinceToCountries: Map<string, string[]> | undefined;

function getProvinceToCountries() {
  if (!provinceToCountries) {
    provinceToCountries = new Map();

    for (const group of provinceGroups) {
      for (const province of group.provinces) {
        const existing = provinceToCountries.get(province) ?? [];

        if (!existing.includes(group.country)) {
          provinceToCountries.set(province, [...existing, group.country]);
        }
      }
    }
  }

  return provinceToCountries;
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((left, right) =>
    left.localeCompare(right, "es"),
  );
}

export function inferCountriesFromProvinces(
  provinces: string[],
  existingCountries?: string[],
) {
  if (provinces.length === 0) {
    return existingCountries?.length ? uniqueSorted(existingCountries) : undefined;
  }

  const inferredCountries = new Set(existingCountries ?? []);
  const provinceToCountryMap = getProvinceToCountries();

  for (const province of provinces) {
    const candidates = provinceToCountryMap.get(province) ?? [];

    if (candidates.length === 1) {
      inferredCountries.add(candidates[0]!);
      continue;
    }

    if (candidates.length === 0) {
      continue;
    }

    const matchingExisting = (existingCountries ?? []).filter((country) =>
      candidates.includes(country),
    );

    if (matchingExisting.length === 1) {
      inferredCountries.add(matchingExisting[0]!);
    }
  }

  return inferredCountries.size > 0
    ? uniqueSorted(Array.from(inferredCountries))
    : undefined;
}

export function inferDefaultLanguagesFromCountries(
  countries: string[],
  existingLanguages?: string[],
) {
  if (existingLanguages?.length) {
    return uniqueSorted(existingLanguages);
  }

  if (countries.length === 0) {
    return undefined;
  }

  const inferredLanguages = new Set<string>();

  for (const country of countries) {
    const defaultLanguage = COUNTRY_DEFAULT_LANGUAGE[country];

    if (defaultLanguage) {
      inferredLanguages.add(defaultLanguage);
    }
  }

  return inferredLanguages.size > 0
    ? uniqueSorted(Array.from(inferredLanguages))
    : undefined;
}
