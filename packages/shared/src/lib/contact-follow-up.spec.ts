import {
  defaultFollowUpOwner,
  followUpDueDate,
  followUpTitle,
  nextFollowUp,
} from "./contact-follow-up";

describe("defaultFollowUpOwner", () => {
  it("gives the follow-up scheduled on capture to the Contact Owner", () => {
    expect(
      defaultFollowUpOwner("capture", { creatorId: 1, contactOwnerId: 5 }),
    ).toBe(5);
  });

  it("gives the capture follow-up to its creator when the Contact has no owner", () => {
    expect(
      defaultFollowUpOwner("capture", { creatorId: 1, contactOwnerId: null }),
    ).toBe(1);
  });

  it("gives any other follow-up to its creator, even on someone else's Contact", () => {
    expect(
      defaultFollowUpOwner("added", { creatorId: 1, contactOwnerId: 5 }),
    ).toBe(1);
  });
});

describe("followUpDueDate", () => {
  it("is today plus the number of days", () => {
    expect(followUpDueDate("2026-10-15", 7)).toBe("2026-10-22");
  });

  it("rolls over months and years", () => {
    expect(followUpDueDate("2026-12-20", 14)).toBe("2027-01-03");
  });

  it("is today for zero days", () => {
    expect(followUpDueDate("2026-10-15", 0)).toBe("2026-10-15");
  });
});

describe("followUpTitle", () => {
  it("names the Contact by their first name", () => {
    expect(followUpTitle("  Paula Ibáñez ")).toBe("Abordar a Paula");
  });
});

describe("nextFollowUp", () => {
  it("is the open follow-up due first", () => {
    const next = nextFollowUp([
      { id: 1, dueDate: "2026-11-01" },
      { id: 2, dueDate: "2026-10-20" },
      { id: 3, dueDate: null },
    ]);
    expect(next?.id).toBe(2);
  });

  it("puts undated follow-ups last", () => {
    expect(nextFollowUp([{ id: 3, dueDate: null }])?.id).toBe(3);
  });

  it("breaks ties by the oldest Task", () => {
    const next = nextFollowUp([
      { id: 9, dueDate: "2026-10-20" },
      { id: 4, dueDate: "2026-10-20" },
    ]);
    expect(next?.id).toBe(4);
  });

  it("is null when there is none", () => {
    expect(nextFollowUp([])).toBeNull();
  });
});
