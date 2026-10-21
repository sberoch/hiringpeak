import { CANDIDATE_COLUMNS } from "./column-catalogues";
import { layoutChoices, resolveLayout } from "./layout";

const everyone = () => true;

const keys = (entries: readonly { key: string }[]) => entries.map((e) => e.key);

/** A layout saved before the new columns existed: today's columns, reordered. */
const savedBeforeNewColumns = [
  { key: "name", visible: true },
  { key: "stars", visible: true },
  { key: "vacancies", visible: true },
  { key: "tags", visible: true },
  { key: "seniority", visible: false },
  { key: "areas", visible: true },
  { key: "industries", visible: false },
  { key: "actions", visible: true },
];

describe("Candidates Column Catalogue", () => {
  it("shows today's columns by default", () => {
    expect(keys(resolveLayout(CANDIDATE_COLUMNS, undefined, everyone))).toEqual(
      [
        "name",
        "vacancies",
        "tags",
        "seniority",
        "areas",
        "industries",
        "stars",
        "actions",
      ],
    );
  });

  it("offers email, phone, LinkedIn, Origen, Países, Idiomas and Fecha de alta as hidden columns", () => {
    const hidden = layoutChoices(CANDIDATE_COLUMNS, undefined, everyone)
      .filter((choice) => !choice.visible)
      .map((choice) => choice.entry.key);

    expect(hidden).toEqual([
      "email",
      "phone",
      "linkedin",
      "source",
      "countries",
      "languages",
      "createdAt",
    ]);
  });

  it("doesn't add the new columns to a layout saved before they existed", () => {
    expect(
      keys(resolveLayout(CANDIDATE_COLUMNS, savedBeforeNewColumns, everyone)),
    ).toEqual(["name", "stars", "vacancies", "tags", "areas", "actions"]);
  });

  it("doesn't offer date of birth or gender", () => {
    const offered = keys(CANDIDATE_COLUMNS);

    expect(offered).not.toContain("dateOfBirth");
    expect(offered).not.toContain("gender");
  });
});
