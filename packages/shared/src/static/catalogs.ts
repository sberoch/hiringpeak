import countriesData from "./countries.json";
import languagesData from "./languages.json";
import provincesData from "./provinces.json";

export interface StaticCountry {
  code: string;
  name: string;
}

export interface StaticLanguage {
  code: string;
  name: string;
}

export interface StaticProvinceGroup {
  code: string;
  country: string;
  provinces: string[];
}

export const countries: StaticCountry[] = countriesData;
export const languages: StaticLanguage[] = languagesData;
export const provinceGroups: StaticProvinceGroup[] = provincesData;

