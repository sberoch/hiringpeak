import { PermissionCode } from "../enums";
import { COMPANY_COLUMNS } from "./column-catalogues";
import { canSeeWith, layoutChoices, resolveLayout } from "./layout";

const commercial = canSeeWith([PermissionCode.CRM_READ]);
const recruiter = canSeeWith([PermissionCode.COMPANY_READ]);

const keys = (entries: readonly { key: string }[]) => entries.map((e) => e.key);

describe("Companies columns", () => {
  it("show today's columns by default to a User with commercial access", () => {
    expect(keys(resolveLayout(COMPANY_COLUMNS, undefined, commercial))).toEqual(
      [
        "name",
        "status",
        "accountOwner",
        "contacts",
        "activeVacancies",
        "openOpportunities",
        "lastInteraction",
        "actions",
      ],
    );
  });

  it("never offer commercial columns to a User without commercial access", () => {
    expect(
      keys(
        layoutChoices(COMPANY_COLUMNS, undefined, recruiter).map(
          (c) => c.entry,
        ),
      ),
    ).toEqual([
      "name",
      "status",
      "accountOwner",
      "contacts",
      "activeVacancies",
      "totalVacancies",
      "createdAt",
      "actions",
    ]);
  });

  it("hide saved commercial columns without access and keep their place for when it returns", () => {
    const saved = [
      { key: "name", visible: true },
      { key: "openOpportunityFee", visible: true },
      { key: "createdAt", visible: true },
      { key: "lastInteraction", visible: true },
      { key: "status", visible: true },
      { key: "accountOwner", visible: false },
      { key: "contacts", visible: false },
      { key: "activeVacancies", visible: false },
      { key: "openOpportunities", visible: false },
      { key: "totalVacancies", visible: false },
      { key: "actions", visible: true },
    ];

    expect({
      without: keys(resolveLayout(COMPANY_COLUMNS, saved, recruiter)),
      restored: keys(resolveLayout(COMPANY_COLUMNS, saved, commercial)),
    }).toEqual({
      without: ["name", "createdAt", "status", "actions"],
      restored: [
        "name",
        "openOpportunityFee",
        "createdAt",
        "lastInteraction",
        "status",
        "actions",
      ],
    });
  });
});
