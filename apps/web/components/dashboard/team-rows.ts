import type {
  CommercialOwnerStats,
  RecruiterStats,
} from "@workspace/shared/types/dashboard";

/** One person in «Rendimiento del equipo»: their recruiting and/or commercial stats. */
export interface TeamRow {
  userId: number;
  name: string;
  recruiting?: RecruiterStats;
  commercial?: CommercialOwnerStats;
}

/**
 * A user can be both a recruiter and an Opportunity Owner, so the two stat
 * lists merge into one row per user. Non-managers only see their own row.
 */
export function buildTeamRows(
  recruiters: RecruiterStats[],
  owners: CommercialOwnerStats[],
  viewer: { userId: number; isManager: boolean },
): TeamRow[] {
  const rows = new Map<number, TeamRow>();
  for (const r of recruiters)
    rows.set(r.userId, { userId: r.userId, name: r.name, recruiting: r });
  for (const o of owners) {
    const row = rows.get(o.ownerId) ?? { userId: o.ownerId, name: o.name };
    rows.set(o.ownerId, { ...row, commercial: o });
  }
  const all = [...rows.values()];
  return viewer.isManager
    ? all
    : all.filter((row) => row.userId === viewer.userId);
}
