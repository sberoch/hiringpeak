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

  it('rejects more than one target', () => {
    expect(
      TaskTargetPolicy.isValid({ candidateId: 1, vacancyId: 2 }),
    ).toBe(false);
    expect(
      TaskTargetPolicy.isValid({
        candidateId: 1,
        vacancyId: 2,
        candidateVacancyId: 3,
      }),
    ).toBe(false);
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
    expect(
      TaskTargetPolicy.countTargets({ candidateId: 5, companyId: 7 }),
    ).toBe(2);
  });
});
