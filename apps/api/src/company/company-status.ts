import { CompanyStatus } from '@workspace/shared/enums';

/**
 * Company Status is derived, never stored: a Company is a Client once it has
 * a won Opportunity or any Vacancy (pre-CRM Vacancies included), otherwise a
 * Prospect. Pure: no I/O, no throw. `companyStatusCondition`
 * (company-status-filter.ts) is the SQL mirror of this rule, used to filter
 * lists: change both together.
 */
export function deriveCompanyStatus(company: {
  opportunities: readonly { isWon: boolean }[];
  vacancyCount: number;
}): CompanyStatus {
  const hasWon = company.opportunities.some((o) => o.isWon);
  return hasWon || company.vacancyCount > 0
    ? CompanyStatus.CLIENT
    : CompanyStatus.PROSPECT;
}
