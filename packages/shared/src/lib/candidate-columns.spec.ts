import { CANDIDATE_COLUMNS } from "./column-catalogues";
import { resolveLayout } from "./layout";

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
