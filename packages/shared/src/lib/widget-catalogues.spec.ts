import { PermissionCode } from "../enums";
import { canSeeWith, layoutChoices, resolveLayout } from "./layout";
import { RAIL_WIDGETS, STAT_WIDGETS, WIDE_WIDGETS } from "./widget-catalogues";

const keysFor = (
  catalogue: readonly { key: string; shownByDefault: boolean }[],
) =>
  resolveLayout(catalogue, undefined, canSeeWith([])).map((entry) => entry.key);

describe("Widget catalogues", () => {
  it("show today's stats by default: active Vacancies, active Candidates, average days open", () => {
    expect(keysFor(STAT_WIDGETS)).toEqual([
      "activeVacancies",
      "activeCandidates",
      "avgDaysOpen",
    ]);
  });

  it("show today's main column by default: team performance, then latest Vacancies", () => {
    expect(keysFor(WIDE_WIDGETS)).toEqual([
      "teamPerformance",
      "latestVacancies",
    ]);
  });

  it("show today's rail by default: due-soon Tasks, then latest Candidates", () => {
    expect(keysFor(RAIL_WIDGETS)).toEqual(["dueSoonTasks", "latestCandidates"]);
  });
});

/** The hidden Widgets an Area's "Agregar" picker offers a new User. */
const addable = (
  catalogue: Parameters<typeof layoutChoices>[0],
  codes: string[],
) =>
  layoutChoices(catalogue, undefined, canSeeWith(codes))
    .filter((choice) => !choice.visible)
    .map((choice) => choice.entry.key);

describe("New Widgets", () => {
  const commercial = [PermissionCode.CRM_READ];

  it("offers every new stat, hidden, to a User with commercial access", () => {
    expect(addable(STAT_WIDGETS, commercial)).toEqual([
      "myActiveVacancies",
      "myOverdueTasks",
      "candidatesAddedLast30Days",
      "openOpportunities",
      "pipelineFee",
    ]);
  });

  it("never offers the commercial stats without commercial access", () => {
    expect(addable(STAT_WIDGETS, [])).toEqual([
      "myActiveVacancies",
      "myOverdueTasks",
      "candidatesAddedLast30Days",
    ]);
  });

  it("offers Opportunities with No Next Step, hidden, in the Rail only with commercial access", () => {
    expect({
      commercial: addable(RAIL_WIDGETS, commercial),
      without: addable(RAIL_WIDGETS, []),
    }).toEqual({ commercial: ["noNextStepOpportunities"], without: [] });
  });
});
