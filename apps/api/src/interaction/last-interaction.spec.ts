import {
  lastInteractionByKey,
  lastInteractionOfOpportunity,
} from './last-interaction';

describe('lastInteractionByKey', () => {
  it('keeps each Contact’s latest Interaction', () => {
    const byContact = lastInteractionByKey([
      { key: 3, id: 10, type: 'call', date: '2026-10-01' },
      { key: 3, id: 11, type: 'lunch', date: '2026-10-05' },
      { key: 5, id: 10, type: 'call', date: '2026-10-01' },
    ]);
    expect(Object.fromEntries(byContact)).toEqual({
      3: { id: 11, type: 'lunch', date: '2026-10-05' },
      5: { id: 10, type: 'call', date: '2026-10-01' },
    });
  });
});

const call = (
  id: number,
  date: string,
  links: { opportunityId: number | null; companyId: number | null },
) => ({ id, type: 'call' as const, date, ...links });

describe('lastInteractionOfOpportunity', () => {
  it('is the latest Interaction tied to the Opportunity', () => {
    const last = lastInteractionOfOpportunity({ id: 1, companyId: 4 }, [
      call(10, '2026-09-01', { opportunityId: 1, companyId: 4 }),
      call(11, '2026-10-01', { opportunityId: 1, companyId: 4 }),
      call(12, '2026-10-10', { opportunityId: null, companyId: 4 }),
    ]);
    expect(last?.id).toBe(11);
  });

  it('falls back to the latest Interaction with its Company', () => {
    const last = lastInteractionOfOpportunity({ id: 1, companyId: 4 }, [
      call(12, '2026-10-10', { opportunityId: null, companyId: 4 }),
      call(13, '2026-10-12', { opportunityId: 2, companyId: 9 }),
    ]);
    expect(last?.id).toBe(12);
  });

  it('is null without any Interaction', () => {
    expect(lastInteractionOfOpportunity({ id: 1, companyId: 4 }, [])).toBe(
      null,
    );
  });
});
