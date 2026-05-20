import { TaskTargetPolicy } from './task-target-policy';

describe('TaskTargetPolicy', () => {
  it('accepts a standalone Task (zero targets)', () => {
    expect(TaskTargetPolicy.isValid({})).toBe(true);
    expect(
      TaskTargetPolicy.isValid({
        candidateId: null,
        vacancyId: null,
        candidateVacancyId: null,
        companyId: null,
      }),
    ).toBe(true);
  });

  it('accepts exactly one target', () => {
    expect(TaskTargetPolicy.isValid({ candidateId: 1 })).toBe(true);
    expect(TaskTargetPolicy.isValid({ vacancyId: 1 })).toBe(true);
    expect(TaskTargetPolicy.isValid({ candidateVacancyId: 1 })).toBe(true);
    expect(TaskTargetPolicy.isValid({ companyId: 1 })).toBe(true);
  });

  it('treats null as absent — one set + three nulls is a single target', () => {
    expect(
      TaskTargetPolicy.isValid({
        candidateId: 7,
        vacancyId: null,
        candidateVacancyId: null,
        companyId: null,
      }),
    ).toBe(true);
    expect(
      TaskTargetPolicy.isValid({
        candidateId: null,
        vacancyId: null,
        candidateVacancyId: 7,
        companyId: null,
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
      ['candidateId', 'candidateVacancyId'],
      ['candidateId', 'companyId'],
      ['vacancyId', 'candidateVacancyId'],
      ['vacancyId', 'companyId'],
      ['candidateVacancyId', 'companyId'],
    ];
    for (const [a, b] of pairs) {
      expect(TaskTargetPolicy.isValid({ [a]: 1, [b]: 2 })).toBe(false);
    }
  });

  it('rejects three targets', () => {
    expect(
      TaskTargetPolicy.isValid({
        candidateId: 1,
        vacancyId: 2,
        candidateVacancyId: 3,
      }),
    ).toBe(false);
    expect(
      TaskTargetPolicy.isValid({
        vacancyId: 1,
        candidateVacancyId: 2,
        companyId: 3,
      }),
    ).toBe(false);
  });

  it('rejects all four targets', () => {
    expect(
      TaskTargetPolicy.isValid({
        candidateId: 1,
        vacancyId: 2,
        candidateVacancyId: 3,
        companyId: 4,
      }),
    ).toBe(false);
  });

  it('counts targets correctly', () => {
    expect(TaskTargetPolicy.countTargets({})).toBe(0);
    expect(TaskTargetPolicy.countTargets({ candidateId: 5 })).toBe(1);
    expect(TaskTargetPolicy.countTargets({ vacancyId: 5 })).toBe(1);
    expect(TaskTargetPolicy.countTargets({ candidateVacancyId: 5 })).toBe(1);
    expect(TaskTargetPolicy.countTargets({ companyId: 5 })).toBe(1);
    expect(
      TaskTargetPolicy.countTargets({ candidateId: 5, companyId: 7 }),
    ).toBe(2);
    expect(
      TaskTargetPolicy.countTargets({
        candidateId: 1,
        vacancyId: 2,
        candidateVacancyId: 3,
        companyId: 4,
      }),
    ).toBe(4);
  });
});
