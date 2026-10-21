import type {
  CommercialOwnerStats,
  RecruiterStats,
} from "@workspace/shared/types/dashboard";

import { buildTeamRows } from "./team-rows";

function recruiter(userId: number, name: string): RecruiterStats {
  return {
    userId,
    name,
    activeVacancies: 1,
    totalVacancies: 1,
    fillRate: null,
    candidatesInPipeline: 0,
    avgTimeToFillDays: null,
  };
}

function owner(ownerId: number, name: string): CommercialOwnerStats {
  return {
    ownerId,
    name,
    open: 1,
    openFee: 0,
    won: 0,
    wonFee: 0,
    closeRate: null,
  };
}

const manager = { userId: 99, isManager: true };

describe("buildTeamRows", () => {
  it("gives a user who is both recruiter and owner a single row with both stats", () => {
    const rows = buildTeamRows(
      [recruiter(1, "Ana")],
      [owner(1, "Ana")],
      manager,
    );

    expect(rows).toEqual([
      expect.objectContaining({
        userId: 1,
        recruiting: expect.objectContaining({ userId: 1 }),
        commercial: expect.objectContaining({ ownerId: 1 }),
      }),
    ]);
  });

  it("keeps owners who are not recruiters, with no recruiting stats", () => {
    const rows = buildTeamRows(
      [recruiter(1, "Ana")],
      [owner(2, "Beto")],
      manager,
    );

    expect(rows.find((r) => r.userId === 2)).toEqual({
      userId: 2,
      name: "Beto",
      commercial: expect.objectContaining({ ownerId: 2 }),
    });
  });

  it("shows a non-manager only their own row", () => {
    const rows = buildTeamRows(
      [recruiter(1, "Ana"), recruiter(2, "Beto")],
      [owner(2, "Beto"), owner(3, "Caro")],
      { userId: 2, isManager: false },
    );

    expect(rows.map((r) => r.userId)).toEqual([2]);
  });
});
