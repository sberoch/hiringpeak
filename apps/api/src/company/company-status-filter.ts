import {
  and,
  eq,
  inArray,
  isNotNull,
  notInArray,
  or,
  type SQL,
} from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import {
  opportunities,
  opportunityStages,
  vacancies,
} from '@workspace/shared/schemas';
import { CompanyStatus } from '@workspace/shared/enums';
import type { DrizzleDatabase } from '../common/database/types/drizzle';

/**
 * SQL mirror of `deriveCompanyStatus`, to filter lists by Company Status:
 * `companyId` (any column holding a Company id) points to a Client when that
 * Company has any Vacancy or a won Opportunity, otherwise to a Prospect.
 * Change both together (company-status.ts); company-status.spec.ts checks
 * that the list filter and the derived status agree.
 */
export function companyStatusCondition(
  db: Pick<DrizzleDatabase, 'select'>,
  companyId: PgColumn,
  status: CompanyStatus,
): SQL {
  const withVacancy = db
    .select({ id: vacancies.companyId })
    .from(vacancies)
    .where(isNotNull(vacancies.companyId));
  const withWonOpportunity = db
    .select({ id: opportunities.companyId })
    .from(opportunities)
    .innerJoin(
      opportunityStages,
      eq(opportunities.stageId, opportunityStages.id),
    )
    .where(eq(opportunityStages.isWon, true));

  if (status === CompanyStatus.CLIENT) {
    return or(
      inArray(companyId, withVacancy),
      inArray(companyId, withWonOpportunity),
    )!;
  }
  return and(
    notInArray(companyId, withVacancy),
    notInArray(companyId, withWonOpportunity),
  )!;
}
