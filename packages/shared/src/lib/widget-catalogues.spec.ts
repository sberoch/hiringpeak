import { PermissionCode } from "../enums";
import { canSeeWith, layoutChoices } from "./layout";
import { RAIL_WIDGETS, STAT_WIDGETS } from "./widget-catalogues";

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

  it("offers every new stat, hidden, to a User with commercial access and TASK_READ", () => {
    expect(
      addable(STAT_WIDGETS, [...commercial, PermissionCode.TASK_READ]),
    ).toEqual([
      "myActiveVacancies",
      "myOverdueTasks",
      "candidatesAddedLast30Days",
      "openOpportunities",
      "pipelineFee",
    ]);
  });

  it("never offers the commercial stats without commercial access", () => {
    expect(addable(STAT_WIDGETS, [PermissionCode.TASK_READ])).toEqual([
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

  it("never offers My overdue Tasks without TASK_READ, which its count needs", () => {
    expect({
      withTaskRead: addable(STAT_WIDGETS, [PermissionCode.TASK_READ]),
      without: addable(STAT_WIDGETS, []),
    }).toEqual({
      withTaskRead: [
        "myActiveVacancies",
        "myOverdueTasks",
        "candidatesAddedLast30Days",
      ],
      without: ["myActiveVacancies", "candidatesAddedLast30Days"],
    });
  });
});
