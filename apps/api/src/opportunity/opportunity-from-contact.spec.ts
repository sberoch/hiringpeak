import { describe, expect, it } from 'vitest';
import { planOpportunityFromContact } from './opportunity-from-contact';

describe('planOpportunityFromContact', () => {
  it("uses the Contact's Company and leaves the Contact as is", () => {
    expect(planOpportunityFromContact({ companyId: 4 }, {})).toEqual({
      ok: true,
      company: { kind: 'existing', companyId: 4 },
      setsContactCompany: false,
    });
  });

  it('rejects another Company when the Contact already has one', () => {
    expect(
      planOpportunityFromContact({ companyId: 4 }, { companyId: 9 }),
    ).toEqual({ ok: false, violation: 'contact_has_company' });
  });

  it('accepts the same Company the Contact already has', () => {
    expect(
      planOpportunityFromContact({ companyId: 4 }, { companyId: 4 }),
    ).toMatchObject({ ok: true, company: { kind: 'existing', companyId: 4 } });
  });

  it('picks an existing Company for a Contact without one and makes it theirs', () => {
    expect(
      planOpportunityFromContact({ companyId: null }, { companyId: 9 }),
    ).toEqual({
      ok: true,
      company: { kind: 'existing', companyId: 9 },
      setsContactCompany: true,
    });
  });

  it('creates a new Company for a Contact without one and makes it theirs', () => {
    expect(
      planOpportunityFromContact(
        { companyId: null },
        { newCompanyName: 'Globex' },
      ),
    ).toEqual({
      ok: true,
      company: { kind: 'new', name: 'Globex' },
      setsContactCompany: true,
    });
  });

  it('requires a Company when the Contact has none', () => {
    expect(planOpportunityFromContact({ companyId: null }, {})).toEqual({
      ok: false,
      violation: 'company_required',
    });
  });

  it('rejects both picking and creating a Company at once', () => {
    expect(
      planOpportunityFromContact(
        { companyId: null },
        { companyId: 9, newCompanyName: 'Globex' },
      ),
    ).toEqual({ ok: false, violation: 'company_required' });
  });
});
