import {
  placeOpenStage,
  reassignOutcome,
  removeStage,
} from './opportunity-stage-layout';

// Default layout: four open stages, then won, then lost.
const STAGES = [
  { id: 1, sort: 0, isWon: false, isLost: false },
  { id: 2, sort: 1, isWon: false, isLost: false },
  { id: 3, sort: 2, isWon: false, isLost: false },
  { id: 4, sort: 3, isWon: false, isLost: false },
  { id: 5, sort: 4, isWon: true, isLost: false },
  { id: 6, sort: 5, isWon: false, isLost: true },
];
const EMPTY: Record<number, number> = {};

describe('reassignOutcome', () => {
  it('moves the won flag to an empty open stage, which joins the outcomes at the end', () => {
    const result = reassignOutcome(STAGES, EMPTY, 3, 'won');
    expect(result).toEqual({
      ok: true,
      stages: [
        { id: 1, sort: 0, isWon: false, isLost: false },
        { id: 2, sort: 1, isWon: false, isLost: false },
        { id: 4, sort: 2, isWon: false, isLost: false },
        { id: 5, sort: 3, isWon: false, isLost: false },
        { id: 3, sort: 4, isWon: true, isLost: false },
        { id: 6, sort: 5, isWon: false, isLost: true },
      ],
    });
  });

  it('is blocked while the stage giving up the flag holds Opportunities', () => {
    const result = reassignOutcome(STAGES, { 6: 2 }, 3, 'lost');
    expect(result).toEqual({
      ok: false,
      violation: 'stage_in_use',
      busy: [{ id: 6, opportunityCount: 2 }],
    });
  });

  it('is blocked while the stage receiving the flag holds Opportunities', () => {
    const result = reassignOutcome(STAGES, { 3: 1 }, 3, 'won');
    expect(result).toEqual({
      ok: false,
      violation: 'stage_in_use',
      busy: [{ id: 3, opportunityCount: 1 }],
    });
  });

  it('ignores Opportunities in stages not involved in the change', () => {
    const result = reassignOutcome(STAGES, { 1: 4, 6: 3 }, 2, 'won');
    expect(result.ok).toBe(true);
  });

  it('refuses to give the won flag to the lost stage, which would leave no lost stage', () => {
    const result = reassignOutcome(STAGES, EMPTY, 6, 'won');
    expect(result).toEqual({ ok: false, violation: 'holds_other_outcome' });
  });

  it('leaves the layout as is when the stage already carries the flag', () => {
    const result = reassignOutcome(STAGES, { 5: 7 }, 5, 'won');
    expect(result).toEqual({ ok: true, stages: STAGES });
  });
});

describe('placeOpenStage', () => {
  const order = (result: ReturnType<typeof placeOpenStage>) =>
    result.ok ? result.stages.map((stage) => stage.id) : result;

  it('moves an open stage up among the open stages', () => {
    expect(order(placeOpenStage(STAGES, 4, 0))).toEqual([4, 1, 2, 3, 5, 6]);
  });

  it('never moves an open stage past the won and lost stages', () => {
    expect(order(placeOpenStage(STAGES, 1, 99))).toEqual([2, 3, 4, 1, 5, 6]);
  });

  it('places a newly added stage last among the open stages by default', () => {
    const added = [...STAGES, { id: 7, sort: 6, isWon: false, isLost: false }];
    expect(order(placeOpenStage(added, 7))).toEqual([1, 2, 3, 4, 7, 5, 6]);
  });

  it('refuses to move the won or lost stage', () => {
    expect(placeOpenStage(STAGES, 6, 0)).toEqual({
      ok: false,
      violation: 'outcome_stage_pinned',
    });
  });

  it('numbers sort consecutively from zero', () => {
    const result = placeOpenStage(STAGES, 2, 0);
    expect(result.ok && result.stages.map((stage) => stage.sort)).toEqual([
      0, 1, 2, 3, 4, 5,
    ]);
  });
});

describe('removeStage', () => {
  it('removes an empty open stage and closes the gap', () => {
    const result = removeStage(STAGES, EMPTY, 2);
    expect(result).toEqual({
      ok: true,
      stages: [
        { id: 1, sort: 0, isWon: false, isLost: false },
        { id: 3, sort: 1, isWon: false, isLost: false },
        { id: 4, sort: 2, isWon: false, isLost: false },
        { id: 5, sort: 3, isWon: true, isLost: false },
        { id: 6, sort: 4, isWon: false, isLost: true },
      ],
    });
  });

  it('refuses to remove a stage that holds Opportunities', () => {
    expect(removeStage(STAGES, { 2: 3 }, 2)).toEqual({
      ok: false,
      violation: 'stage_in_use',
      opportunityCount: 3,
    });
  });

  it('refuses to remove the won or lost stage', () => {
    expect(removeStage(STAGES, EMPTY, 5)).toEqual({
      ok: false,
      violation: 'outcome_stage',
    });
  });

  it('refuses to remove the last open stage, where new Opportunities start', () => {
    const minimal = STAGES.filter((stage) => stage.id >= 4);
    expect(removeStage(minimal, EMPTY, 4)).toEqual({
      ok: false,
      violation: 'last_open_stage',
    });
  });
});
