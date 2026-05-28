import {
  inferCountriesFromProvinces,
  inferDefaultLanguagesFromCountries,
} from "./location-defaults";

describe("location-defaults", () => {
  describe("inferCountriesFromProvinces", () => {
    it("infers Argentina from Buenos Aires", () => {
      expect(inferCountriesFromProvinces(["Buenos Aires"])).toEqual([
        "Argentina",
      ]);
    });

    it("does not infer a country for ambiguous Santa Cruz without context", () => {
      expect(inferCountriesFromProvinces(["Santa Cruz"])).toBeUndefined();
    });

    it("keeps Bolivia when Santa Cruz is ambiguous but Bolivia is already set", () => {
      expect(
        inferCountriesFromProvinces(["Santa Cruz"], ["Bolivia"]),
      ).toEqual(["Bolivia"]);
    });

    it("infers multiple countries from unambiguous provinces", () => {
      expect(
        inferCountriesFromProvinces(["Buenos Aires", "São Paulo"]),
      ).toEqual(["Argentina", "Brasil"]);
    });

    it("merges with pre-existing countries without duplicates", () => {
      expect(
        inferCountriesFromProvinces(["Buenos Aires"], ["Chile"]),
      ).toEqual(["Argentina", "Chile"]);
    });
  });

  describe("inferDefaultLanguagesFromCountries", () => {
    it("defaults Argentina to Español", () => {
      expect(inferDefaultLanguagesFromCountries(["Argentina"])).toEqual([
        "Español",
      ]);
    });

    it("defaults Brasil to Portugués", () => {
      expect(inferDefaultLanguagesFromCountries(["Brasil"])).toEqual([
        "Portugués",
      ]);
    });

    it("dedupes the same default language for multiple countries", () => {
      expect(
        inferDefaultLanguagesFromCountries(["Argentina", "Uruguay"]),
      ).toEqual(["Español"]);
    });

    it("does not override existing languages", () => {
      expect(
        inferDefaultLanguagesFromCountries(["Argentina"], ["Inglés"]),
      ).toEqual(["Inglés"]);
    });

    it("returns undefined when countries are empty", () => {
      expect(inferDefaultLanguagesFromCountries([])).toBeUndefined();
    });
  });
});
