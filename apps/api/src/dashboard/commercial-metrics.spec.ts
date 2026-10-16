import {
  CommercialOpportunityRow,
  computeCommercialSummary,
} from './commercial-metrics';

const NOW = new Date(2026, 9, 15, 12, 0, 0);
const ANA = { ownerId: 1, ownerName: 'Ana' };

function row(
  overrides: Partial<CommercialOpportunityRow>,
): CommercialOpportunityRow {
  return {
    ...ANA,
    outcome: 'open',
    estimatedFee: null,
    createdAt: new Date(2026, 0, 10),
    closeDate: null,
    ...overrides,
  };
}

describe('computeCommercialSummary', () => {
  it('ignores Opportunities without an Estimated Fee in the open fee total', () => {
    const summary = computeCommercialSummary(
      [row({ estimatedFee: '1000.00' }), row({ estimatedFee: null })],
      NOW,
    );
    expect(summary.openFee).toBe(1000);
  });

  it('counts as won this year only Opportunities whose Close Date is in the current year', () => {
    const summary = computeCommercialSummary(
      [
        row({ outcome: 'won', estimatedFee: '500', closeDate: '2026-02-01' }),
        // Won in the CRM this month, but backdated into last year.
        row({
          outcome: 'won',
          estimatedFee: '9000',
          closeDate: '2025-12-30',
          createdAt: new Date(2026, 9, 1),
        }),
      ],
      NOW,
    );
    expect({
      won: summary.wonThisYear,
      fee: summary.wonFeeThisYear,
    }).toEqual({ won: 1, fee: 500 });
  });

  it('counts "+N este mes" as Opportunities created this calendar month, whatever their stage', () => {
    const summary = computeCommercialSummary(
      [
        row({ createdAt: new Date(2026, 9, 1, 0, 5) }),
        row({
          createdAt: new Date(2026, 9, 14),
          outcome: 'lost',
          closeDate: '2026-10-14',
        }),
        row({ createdAt: new Date(2026, 8, 30, 23, 55) }),
        row({ createdAt: new Date(2025, 9, 10) }),
      ],
      NOW,
    );
    expect(summary.createdThisMonth).toBe(2);
  });

  it('computes Tasa de cierre by count among Opportunities closed this year, not by fee', () => {
    const summary = computeCommercialSummary(
      [
        row({ outcome: 'won', estimatedFee: '100', closeDate: '2026-03-01' }),
        row({
          outcome: 'lost',
          estimatedFee: '50000',
          closeDate: '2026-04-01',
        }),
        row({ outcome: 'lost', estimatedFee: '700', closeDate: '2026-05-01' }),
        row({ outcome: 'won', estimatedFee: '700', closeDate: '2026-06-01' }),
        // Closed last year: out of this year's rate.
        row({ outcome: 'lost', closeDate: '2025-11-01' }),
      ],
      NOW,
    );
    expect(summary.owners[0].closeRate).toBe(50);
  });

  it('gives every Opportunity Owner their own row with their own figures', () => {
    const BRUNO = { ownerId: 2, ownerName: 'Bruno' };
    const summary = computeCommercialSummary(
      [
        row({ estimatedFee: '300' }),
        row({ ...BRUNO, estimatedFee: '1200' }),
        row({
          ...BRUNO,
          outcome: 'won',
          estimatedFee: '800',
          closeDate: '2026-07-01',
        }),
      ],
      NOW,
    );
    expect(summary.owners).toEqual([
      {
        ownerId: 2,
        name: 'Bruno',
        open: 1,
        openFee: 1200,
        won: 1,
        wonFee: 800,
        closeRate: 100,
      },
      {
        ownerId: 1,
        name: 'Ana',
        open: 1,
        openFee: 300,
        won: 0,
        wonFee: 0,
        closeRate: null,
      },
    ]);
  });
});
