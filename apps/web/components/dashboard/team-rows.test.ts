import type {
  CommercialOwnerStats,
  RecruiterStats,
} from "@workspace/shared/types/dashboard";

import { PermissionCode } from "@workspace/shared/enums";

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

const manager = { userId: 99, permissionCodes: [PermissionCode.TASK_READ_ALL] };

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

  it("shows a user with TASK_READ_ALL every row", () => {
    const rows = buildTeamRows(
      [recruiter(1, "Ana"), recruiter(2, "Beto")],
      [owner(3, "Caro")],
      { userId: 2, permissionCodes: [PermissionCode.TASK_READ_ALL] },
    );

    expect(rows.map((r) => r.userId).sort()).toEqual([1, 2, 3]);
  });

  it("shows a user without TASK_READ_ALL only their own row, whatever else they can do", () => {
    const rows = buildTeamRows(
      [recruiter(1, "Ana"), recruiter(2, "Beto")],
      [owner(2, "Beto"), owner(3, "Caro")],
      {
        userId: 2,
        permissionCodes: [PermissionCode.TASK_READ, PermissionCode.ROLE_MANAGE],
      },
    );

    expect(rows.map((r) => r.userId)).toEqual([2]);
  });
});
