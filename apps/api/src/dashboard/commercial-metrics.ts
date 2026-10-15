/**
 * Commercial dashboard metrics: the «Comercial» Dashboard section computed from
 * plain Opportunity rows for a given "now". Pure: no I/O, no throw. Always the
 * current calendar year (no period parameter), matching "Rendimiento por
 * reclutador". See CONTEXT.md (`Opportunity`, `Estimated Fee`,
 * `Opportunity Close Date`).
 */
import type {
  CommercialOwnerStats,
  CommercialSummary,
} from '@workspace/shared/types/dashboard';

export type OpportunityOutcome = 'open' | 'won' | 'lost';

export type CommercialOpportunityRow = {
  ownerId: number;
  ownerName: string;
  outcome: OpportunityOutcome;
  /** Numeric string as returned by pg; null until estimated. */
  estimatedFee: string | null;
  createdAt: Date;
  /** Day `YYYY-MM-DD`; present only while won or lost. */
  closeDate: string | null;
};

/** Opportunities without an Estimated Fee are silently left out of sums. */
function sumFees(rows: CommercialOpportunityRow[]): number {
  return rows.reduce(
    (sum, r) => (r.estimatedFee == null ? sum : sum + Number(r.estimatedFee)),
    0,
  );
}

/** "This year" follows the Close Date, not when the stage was changed. */
function closedThisYear(row: CommercialOpportunityRow, now: Date): boolean {
  return (
    row.closeDate != null && row.closeDate.startsWith(`${now.getFullYear()}-`)
  );
}

function createdThisMonth(row: CommercialOpportunityRow, now: Date): boolean {
  return (
    row.createdAt.getFullYear() === now.getFullYear() &&
    row.createdAt.getMonth() === now.getMonth()
  );
}

function tally(rows: CommercialOpportunityRow[], now: Date) {
  const open = rows.filter((r) => r.outcome === 'open');
  const closed = rows.filter(
    (r) => r.outcome !== 'open' && closedThisYear(r, now),
  );
  const won = closed.filter((r) => r.outcome === 'won');
  return {
    open: open.length,
    openFee: sumFees(open),
    won: won.length,
    wonFee: sumFees(won),
    closeRate:
      closed.length === 0
        ? null
        : Math.round((won.length / closed.length) * 100),
  };
}

export function computeCommercialSummary(
  rows: CommercialOpportunityRow[],
  now: Date,
): CommercialSummary {
  const totals = tally(rows, now);

  const byOwner = new Map<number, CommercialOpportunityRow[]>();
  for (const r of rows) {
    byOwner.set(r.ownerId, [...(byOwner.get(r.ownerId) ?? []), r]);
  }
  const owners: CommercialOwnerStats[] = [...byOwner.values()]
    .map((ownerRows) => ({
      ownerId: ownerRows[0].ownerId,
      name: ownerRows[0].ownerName,
      ...tally(ownerRows, now),
    }))
    .filter((o) => o.open > 0 || o.closeRate != null)
    .sort((a, b) => b.openFee - a.openFee || a.name.localeCompare(b.name));

  return {
    open: totals.open,
    createdThisMonth: rows.filter((r) => createdThisMonth(r, now)).length,
    openFee: totals.openFee,
    wonThisYear: totals.won,
    wonFeeThisYear: totals.wonFee,
    owners,
  };
}
