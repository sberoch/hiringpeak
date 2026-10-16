import { VacancyOpportunityPolicy } from './vacancy-opportunity-policy';

describe('VacancyOpportunityPolicy.canLink', () => {
  it('lets a won Opportunity produce a Vacancy on its Company', () => {
    expect(
      VacancyOpportunityPolicy.canLink({
        opportunity: { companyId: 1, stage: { isWon: true } },
        vacancyCompanyId: 1,
      }),
    ).toEqual({ ok: true });
  });

  it('rejects an Opportunity in an open stage', () => {
    expect(
      VacancyOpportunityPolicy.canLink({
        opportunity: { companyId: 1, stage: { isWon: false } },
        vacancyCompanyId: 1,
      }),
    ).toEqual({ ok: false, reason: 'opportunity_not_won' });
  });

  it('rejects a lost Opportunity', () => {
    const lostStage = { isWon: false, isLost: true };
    expect(
      VacancyOpportunityPolicy.canLink({
        opportunity: { companyId: 1, stage: lostStage },
        vacancyCompanyId: 1,
      }),
    ).toEqual({ ok: false, reason: 'opportunity_not_won' });
  });

  it('rejects linking a Vacancy of another Company', () => {
    expect(
      VacancyOpportunityPolicy.canLink({
        opportunity: { companyId: 1, stage: { isWon: true } },
        vacancyCompanyId: 2,
      }),
    ).toEqual({ ok: false, reason: 'different_company' });
  });
});
