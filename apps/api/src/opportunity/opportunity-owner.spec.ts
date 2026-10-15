import { describe, expect, it } from 'vitest';
import { defaultOpportunityOwner } from './opportunity-owner';

describe('defaultOpportunityOwner', () => {
  it("defaults to the Company's Account Owner", () => {
    expect(
      defaultOpportunityOwner({
        requested: undefined,
        accountOwnerId: 7,
        creatorId: 2,
      }),
    ).toBe(7);
  });

  it('falls back to the creator when the Company has no Account Owner', () => {
    expect(
      defaultOpportunityOwner({
        requested: undefined,
        accountOwnerId: null,
        creatorId: 2,
      }),
    ).toBe(2);
  });

  it('keeps an explicitly chosen owner', () => {
    expect(
      defaultOpportunityOwner({
        requested: 5,
        accountOwnerId: 7,
        creatorId: 2,
      }),
    ).toBe(5);
  });
});
