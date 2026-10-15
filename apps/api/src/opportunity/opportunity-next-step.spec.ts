import { hasNoNextStep, nextStepOf } from './opportunity-next-step';

const open = { isWon: false, isLost: false };

describe('nextStepOf', () => {
  it('is the open Task due first', () => {
    const next = nextStepOf([
      { id: 1, dueDate: '2026-10-20' },
      { id: 2, dueDate: '2026-10-17' },
      { id: 3, dueDate: '2026-11-01' },
    ]);
    expect(next?.id).toBe(2);
  });

  it('puts undated Tasks after dated ones', () => {
    const next = nextStepOf([
      { id: 1, dueDate: null },
      { id: 2, dueDate: '2027-03-01' },
    ]);
    expect(next?.id).toBe(2);
  });

  it('on the same due date, is the Task created first', () => {
    const next = nextStepOf([
      { id: 9, dueDate: '2026-10-20' },
      { id: 4, dueDate: '2026-10-20' },
    ]);
    expect(next?.id).toBe(4);
  });

  it('is none without open Tasks', () => {
    expect(nextStepOf([])).toBeNull();
  });
});

describe('hasNoNextStep', () => {
  it('an open Opportunity without an open Task has No Next Step', () => {
    expect(hasNoNextStep(open, null)).toBe(true);
  });

  it('an open Opportunity with an open Task has a next step', () => {
    expect(hasNoNextStep(open, { id: 1, dueDate: null })).toBe(false);
  });

  it('a won Opportunity never has No Next Step', () => {
    expect(hasNoNextStep({ isWon: true, isLost: false }, null)).toBe(false);
  });

  it('a lost Opportunity never has No Next Step', () => {
    expect(hasNoNextStep({ isWon: false, isLost: true }, null)).toBe(false);
  });
});
