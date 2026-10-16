import { NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { companies } from '@workspace/shared/schemas';
import type { DrizzleDatabase } from '../common/database/types/drizzle';

/**
 * A Company referenced by a request (a Contact's employer, an Opportunity's
 * or an Interaction's Company) must belong to the caller's Organization.
 * Returns what callers need from it; throws the same error everywhere.
 */
export async function findCompanyInOrganization(
  db: Pick<DrizzleDatabase, 'query'>,
  companyId: number,
  organizationId: number,
): Promise<{ id: number; accountOwnerId: number | null }> {
  const company = await db.query.companies.findFirst({
    columns: { id: true, accountOwnerId: true },
    where: and(
      eq(companies.id, companyId),
      eq(companies.organizationId, organizationId),
    ),
  });
  if (!company) throw new NotFoundException('La empresa no existe.');
  return company;
}
