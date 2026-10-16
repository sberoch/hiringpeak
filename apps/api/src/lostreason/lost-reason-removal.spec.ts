import { checkLostReasonRemoval } from './lost-reason-removal';

describe('checkLostReasonRemoval', () => {
  it('allows removing an unused Lost Reason while others remain', () => {
    expect(
      checkLostReasonRemoval({ reasonCount: 2, opportunityCount: 0 }),
    ).toEqual({ ok: true });
  });

  it('blocks removing the last Lost Reason, so a loss can always be explained', () => {
    expect(
      checkLostReasonRemoval({ reasonCount: 1, opportunityCount: 0 }),
    ).toEqual({ ok: false, violation: 'last_lost_reason' });
  });

  it('blocks removing a Lost Reason that lost Opportunities still carry', () => {
    expect(
      checkLostReasonRemoval({ reasonCount: 5, opportunityCount: 2 }),
    ).toEqual({ ok: false, violation: 'in_use', opportunityCount: 2 });
  });
});
