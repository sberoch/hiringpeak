import {
  canSeeWith,
  type LayoutCatalogueEntry,
  layoutChoices,
  rearrangeLayout,
  resolveLayout,
} from "./layout";

const everyone = () => true;

const catalogue: LayoutCatalogueEntry[] = [
  { key: "name", shownByDefault: true, lock: "first" },
  { key: "company", shownByDefault: true },
  { key: "owner", shownByDefault: true },
  { key: "email", shownByDefault: false },
  { key: "actions", shownByDefault: true, lock: "last" },
];

const keys = (entries: readonly LayoutCatalogueEntry[]) => entries.map((e) => e.key);

describe("resolveLayout", () => {
  it("shows the default-shown entries in catalogue order when nothing is saved", () => {
    expect(keys(resolveLayout(catalogue, undefined, everyone))).toEqual([
      "name",
      "company",
      "owner",
      "actions",
    ]);
  });

  it("follows the saved order and visibility", () => {
    const saved = [
      { key: "name", visible: true },
      { key: "email", visible: true },
      { key: "owner", visible: true },
      { key: "company", visible: false },
      { key: "actions", visible: true },
    ];
    expect(keys(resolveLayout(catalogue, saved, everyone))).toEqual([
      "name",
      "email",
      "owner",
      "actions",
    ]);
  });

  it("forces locked entries to their end and always shows them", () => {
    const saved = [
      { key: "actions", visible: true },
      { key: "company", visible: true },
      { key: "name", visible: false },
      { key: "owner", visible: true },
    ];
    expect(keys(resolveLayout(catalogue, saved, everyone))).toEqual([
      "name",
      "company",
      "owner",
      "actions",
    ]);
  });

  it("drops entries the User may not see", () => {
    const notOwner = (entry: LayoutCatalogueEntry) => entry.key !== "owner";
    expect(keys(resolveLayout(catalogue, undefined, notOwner))).toEqual([
      "name",
      "company",
      "actions",
    ]);
  });

  describe("with a layout saved before the catalogue changed", () => {
    const saved = [
      { key: "name", visible: true },
      { key: "company", visible: true },
      { key: "actions", visible: true },
    ];

    it("appends new shown-by-default entries", () => {
      expect(keys(resolveLayout(catalogue, saved, everyone))).toEqual([
        "name",
        "company",
        "owner",
        "actions",
      ]);
    });

    it("keeps new hidden-by-default entries hidden", () => {
      expect(keys(resolveLayout(catalogue, saved, everyone))).not.toContain(
        "email",
      );
    });
  });

  it("ignores saved keys that are no longer in the catalogue", () => {
    const saved = [
      { key: "name", visible: true },
      { key: "fax", visible: true },
      { key: "company", visible: true },
      { key: "owner", visible: true },
      { key: "actions", visible: true },
    ];
    expect(keys(resolveLayout(catalogue, saved, everyone))).toEqual([
      "name",
      "company",
      "owner",
      "actions",
    ]);
  });
});

describe("layoutChoices", () => {
  it("lists every entry the User may see in order, hidden ones included", () => {
    const notOwner = (entry: LayoutCatalogueEntry) => entry.key !== "owner";
    const saved = [
      { key: "email", visible: true },
      { key: "owner", visible: true },
      { key: "company", visible: false },
    ];
    expect(
      layoutChoices(catalogue, saved, notOwner).map((choice) => [
        choice.entry.key,
        choice.visible,
      ]),
    ).toEqual([
      ["name", true],
      ["email", true],
      ["company", false],
      ["actions", true],
    ]);
  });
});

describe("rearrangeLayout", () => {
  const notOwner = (entry: LayoutCatalogueEntry) => entry.key !== "owner";

  it("keeps entries the User may not see where they were, so they return with access", () => {
    const saved = [
      { key: "name", visible: true },
      { key: "owner", visible: true },
      { key: "company", visible: true },
      { key: "email", visible: false },
      { key: "actions", visible: true },
    ];
    const next = rearrangeLayout(catalogue, saved, notOwner, [
      { key: "name", visible: true },
      { key: "email", visible: true },
      { key: "company", visible: true },
      { key: "actions", visible: true },
    ]);
    expect(keys(resolveLayout(catalogue, next, everyone))).toEqual([
      "name",
      "owner",
      "email",
      "company",
      "actions",
    ]);
  });
});

describe("canSeeWith", () => {
  const commercial: LayoutCatalogueEntry = {
    key: "fee",
    shownByDefault: false,
    requires: ["CRM_READ", "CRM_MANAGE"],
  };

  it("lets a User holding any one of the required codes see the entry", () => {
    expect(canSeeWith(["CRM_MANAGE"])(commercial)).toBe(true);
  });

  it("hides the entry from a User holding none of the required codes", () => {
    expect(canSeeWith(["CANDIDATE_READ"])(commercial)).toBe(false);
  });

  it("shows entries that require nothing to everyone", () => {
    expect(canSeeWith([])({ key: "name", shownByDefault: true })).toBe(true);
  });
});
