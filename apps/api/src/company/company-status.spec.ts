import { describe, expect, it } from 'vitest';
import { CompanyStatus } from '@workspace/shared/enums';
import { deriveCompanyStatus } from './company-status';

const open = { isWon: false };
const won = { isWon: true };
const lost = { isWon: false };

describe('deriveCompanyStatus', () => {
  it('a won Opportunity makes the Company a Client', () => {
    expect(
      deriveCompanyStatus({ opportunities: [open, won], vacancyCount: 0 }),
    ).toBe(CompanyStatus.CLIENT);
  });

  it('a pre-CRM Vacancy alone makes the Company a Client', () => {
    expect(deriveCompanyStatus({ opportunities: [], vacancyCount: 1 })).toBe(
      CompanyStatus.CLIENT,
    );
  });

  it('open or lost Opportunities alone keep the Company a Prospect', () => {
    expect(
      deriveCompanyStatus({ opportunities: [open, lost], vacancyCount: 0 }),
    ).toBe(CompanyStatus.PROSPECT);
  });

  it('a Company with nothing is a Prospect', () => {
    expect(deriveCompanyStatus({ opportunities: [], vacancyCount: 0 })).toBe(
      CompanyStatus.PROSPECT,
    );
  });
});
