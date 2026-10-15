import { editCloseDate, transitionStage } from './opportunity-stage-transition';

const OPEN = { id: 1, isWon: false, isLost: false };
const WON = { id: 5, isWon: true, isLost: false };
const LOST = { id: 6, isWon: false, isLost: true };
const TODAY = '2026-10-15';

describe('transitionStage', () => {
  it('rejects entering the lost stage without a Lost Reason', () => {
    const result = transitionStage({ target: LOST, today: TODAY });
    expect(result).toEqual({ ok: false, violation: 'lost_reason_required' });
  });

  it('sets the Close Date to today when entering won without one', () => {
    const result = transitionStage({ target: WON, today: TODAY });
    expect(result).toEqual({
      ok: true,
      fields: { stageId: WON.id, lostReasonId: null, closeDate: TODAY },
    });
  });

  it('keeps a supplied backdated Close Date and the Lost Reason when entering lost', () => {
    const result = transitionStage({
      target: LOST,
      lostReasonId: 3,
      closeDate: '2026-09-30',
      today: TODAY,
    });
    expect(result).toEqual({
      ok: true,
      fields: { stageId: LOST.id, lostReasonId: 3, closeDate: '2026-09-30' },
    });
  });

  it('clears the Close Date and Lost Reason when leaving lost for an open stage', () => {
    const result = transitionStage({
      target: OPEN,
      lostReasonId: 3,
      closeDate: '2026-09-30',
      today: TODAY,
    });
    expect(result).toEqual({
      ok: true,
      fields: { stageId: OPEN.id, lostReasonId: null, closeDate: null },
    });
  });

  it('does not carry a Lost Reason into the won stage', () => {
    const result = transitionStage({
      target: WON,
      lostReasonId: 3,
      today: TODAY,
    });
    expect(result).toEqual({
      ok: true,
      fields: { stageId: WON.id, lostReasonId: null, closeDate: TODAY },
    });
  });

  it('leaves Close Date and Lost Reason empty on an open-to-open move', () => {
    const result = transitionStage({
      target: { id: 2, isWon: false, isLost: false },
      today: TODAY,
    });
    expect(result).toEqual({
      ok: true,
      fields: { stageId: 2, lostReasonId: null, closeDate: null },
    });
  });
});

describe('editCloseDate', () => {
  it('rejects a Close Date on an Opportunity in an open stage', () => {
    expect(editCloseDate(OPEN, '2026-09-30')).toEqual({
      ok: false,
      violation: 'not_closed',
    });
  });

  it('accepts a backdated Close Date on a won Opportunity', () => {
    expect(editCloseDate(WON, '2025-12-31')).toEqual({
      ok: true,
      closeDate: '2025-12-31',
    });
  });
});
