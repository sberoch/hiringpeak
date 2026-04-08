/* eslint-disable */
import { and, eq } from 'drizzle-orm';
import { CompanyStatus } from '@workspace/shared/enums';
import { companies } from '@workspace/shared/schemas';
import { SeedTx } from './types';

const companiesList = [
  'Volkswagen Argentina',
  'Salentein',
  'Corven',
  'Hospital Británico',
  'Laboratorios Elea',
  'Hospital Italiano',
];

async function findOrCreateCompany(
  tx: SeedTx,
  name: string,
  organizationId: number,
) {
  const [existing] = await tx
    .select({ id: companies.id })
    .from(companies)
    .where(
      and(
        eq(companies.name, name),
        eq(companies.organizationId, organizationId),
      ),
    )
    .limit(1);
  if (existing) {
    console.log(`  Company "${name}" already exists (id=${existing.id}), skipping`);
    return existing.id;
  }

  const [row] = await tx
    .insert(companies)
    .values({
      name,
      description: '',
      status: CompanyStatus.ACTIVE,
      organizationId,
    })
    .returning({ id: companies.id });
  if (!row) throw new Error(`Company insert failed for ${name}`);
  console.log(`  Company "${name}" created (id=${row.id})`);
  return row.id;
}

export async function seedCompanies(tx: SeedTx, organizationId: number) {
  console.log('Seeding companies...');
  const companyIds = new Map<string, number>();
  for (const name of companiesList) {
    const id = await findOrCreateCompany(tx, name, organizationId);
    companyIds.set(name, id);
  }
  return { companyIds };
}
