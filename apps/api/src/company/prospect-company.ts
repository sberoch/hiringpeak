import { companies } from '@workspace/shared/schemas';
import { CompanyStatus } from '@workspace/shared/enums';
import type { DrizzleDatabase } from '../common/database/types/drizzle';

/**
 * "Pick or create" a Company by name (Contact capture, "Crear oportunidad"):
 * a new Company starts as a Prospect, with no description. Runs on the
 * caller's transaction.
 */
export async function insertProspectCompany(
  tx: Pick<DrizzleDatabase, 'insert'>,
  name: string,
  organizationId: number,
): Promise<number> {
  const [company] = await tx
    .insert(companies)
    .values({
      name,
      description: '',
      status: CompanyStatus.PROSPECT,
      organizationId,
    })
    .returning({ id: companies.id });
  return company.id;
}
