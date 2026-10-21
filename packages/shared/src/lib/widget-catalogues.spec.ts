import { canSeeWith, resolveLayout } from "./layout";
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
