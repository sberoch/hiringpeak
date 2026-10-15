import { stampInteractionCompany } from './interaction-company-stamp';

describe('stampInteractionCompany', () => {
  it('defaults to the Contacts’ shared current Company', () => {
    const result = stampInteractionCompany({
      contactCompanyIds: [4, 4],
    });
    expect(result).toEqual({ companyId: 4, violation: null });
  });

  it('stays without a Company when the Contacts are at different Companies', () => {
    const result = stampInteractionCompany({
      contactCompanyIds: [4, 9],
    });
    expect(result).toEqual({ companyId: null, violation: null });
  });

  it('records the Company the user picked, whatever the Contacts’ current one', () => {
    const result = stampInteractionCompany({
      companyId: 7,
      contactCompanyIds: [4],
    });
    expect(result).toEqual({ companyId: 7, violation: null });
  });

  it('records a Company-only Interaction', () => {
    const result = stampInteractionCompany({
      companyId: 7,
      contactCompanyIds: [],
    });
    expect(result).toEqual({ companyId: 7, violation: null });
  });

  it('defaults to the Opportunity’s Company when tied to one', () => {
    const result = stampInteractionCompany({
      opportunityCompanyId: 7,
      contactCompanyIds: [4],
    });
    expect(result).toEqual({ companyId: 7, violation: null });
  });

  it('rejects an Opportunity of another Company', () => {
    const result = stampInteractionCompany({
      companyId: 4,
      opportunityCompanyId: 7,
      contactCompanyIds: [4],
    });
    expect(result.violation).not.toBeNull();
  });

  it('rejects an Interaction with neither Contacts nor a Company', () => {
    const result = stampInteractionCompany({ contactCompanyIds: [] });
    expect(result.violation).not.toBeNull();
  });
});
