import { VacancyContactPolicy } from './vacancy-contact-policy';

describe('VacancyContactPolicy.resolve', () => {
  const current = { companyId: 1, vacancyContactId: 10 };

  it('clears the Vacancy Contact when the Company changes and none is named', () => {
    expect(
      VacancyContactPolicy.resolve({ current, patch: { companyId: 2 } }),
    ).toEqual({ ok: true, vacancyContactId: null });
  });

  it('leaves the Vacancy Contact untouched when the Company stays', () => {
    expect(
      VacancyContactPolicy.resolve({ current, patch: { companyId: 1 } }),
    ).toEqual({ ok: true, vacancyContactId: undefined });
  });

  it('accepts a Contact who currently works at the Vacancy Company', () => {
    expect(
      VacancyContactPolicy.resolve({
        current,
        patch: { companyId: 2, vacancyContactId: 20 },
        contactCompanyId: 2,
      }),
    ).toEqual({ ok: true, vacancyContactId: 20 });
  });

  it('rejects a Contact from another Company', () => {
    expect(
      VacancyContactPolicy.resolve({
        current: null,
        patch: { companyId: 1, vacancyContactId: 20 },
        contactCompanyId: 2,
      }),
    ).toEqual({ ok: false, reason: 'contact_not_at_company' });
  });

  it('keeps a Vacancy Contact who has since moved to another Company', () => {
    expect(
      VacancyContactPolicy.resolve({
        current,
        patch: { companyId: 1, vacancyContactId: 10 },
        contactCompanyId: 5,
      }),
    ).toEqual({ ok: true, vacancyContactId: undefined });
  });

  it('accepts "Ninguno" explicitly', () => {
    expect(
      VacancyContactPolicy.resolve({
        current,
        patch: { vacancyContactId: null },
      }),
    ).toEqual({ ok: true, vacancyContactId: null });
  });
});
