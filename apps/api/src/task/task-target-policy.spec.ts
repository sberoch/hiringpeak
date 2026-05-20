import { TaskTargetPolicy } from './task-target-policy';

describe('TaskTargetPolicy', () => {
  it('accepts a standalone Task (zero targets)', () => {
    expect(TaskTargetPolicy.isValid({})).toBe(true);
    expect(
      TaskTargetPolicy.isValid({
        candidateId: null,
        vacancyId: null,
        companyId: null,
      }),
    ).toBe(true);
  });

  it('accepts exactly one target', () => {
    expect(TaskTargetPolicy.isValid({ candidateId: 1 })).toBe(true);
    expect(TaskTargetPolicy.isValid({ vacancyId: 1 })).toBe(true);
    expect(TaskTargetPolicy.isValid({ companyId: 1 })).toBe(true);
  });

  it('treats null as absent — one set + two nulls is a single target', () => {
    expect(
      TaskTargetPolicy.isValid({
        candidateId: 7,
        vacancyId: null,
        companyId: null,
      }),
    ).toBe(true);
    expect(
      TaskTargetPolicy.isValid({
        candidateId: null,
        vacancyId: null,
        companyId: 7,
      }),
    ).toBe(true);
  });

  it('rejects every pair of real targets', () => {
    const pairs: Array<
      [
        keyof Parameters<typeof TaskTargetPolicy.isValid>[0],
        keyof Parameters<typeof TaskTargetPolicy.isValid>[0],
      ]
    > = [
      ['candidateId', 'vacancyId'],
      ['candidateId', 'companyId'],
      ['vacancyId', 'companyId'],
    ];
    for (const [a, b] of pairs) {
      expect(TaskTargetPolicy.isValid({ [a]: 1, [b]: 2 })).toBe(false);
    }
  });

  it('rejects all three targets', () => {
    expect(
      TaskTargetPolicy.isValid({
        candidateId: 1,
        vacancyId: 2,
        companyId: 3,
      }),
    ).toBe(false);
  });

  it('counts targets correctly', () => {
    expect(TaskTargetPolicy.countTargets({})).toBe(0);
    expect(TaskTargetPolicy.countTargets({ candidateId: 5 })).toBe(1);
    expect(TaskTargetPolicy.countTargets({ vacancyId: 5 })).toBe(1);
    expect(TaskTargetPolicy.countTargets({ companyId: 5 })).toBe(1);
    expect(
      TaskTargetPolicy.countTargets({ candidateId: 5, companyId: 7 }),
    ).toBe(2);
    expect(
      TaskTargetPolicy.countTargets({
        candidateId: 1,
        vacancyId: 2,
        companyId: 3,
      }),
    ).toBe(3);
  });
});
