/* eslint-disable */
/**
 * Dev seed: inserts at least one row per schema entity so the app can be used end-to-end.
 * Assumes an empty DB (e.g. run after db:reset). Do not run against a DB that already has data
 * you want to keep, or make it idempotent (e.g. skip if rows exist) before using on shared DBs.
 *
 * Run via: pnpm run db:seed (tsx src/common/database/seed.ts)
 * Standalone script: uses Drizzle + pg directly (no Nest) so it always completes.
 */
import { config } from 'dotenv';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '@workspace/shared/schemas';
import { organizations } from '@workspace/shared/schemas';

import { seedPermissionsAndRoles } from './seed/permissions';
import { seedUsers } from './seed/users';
import { seedCatalogs } from './seed/catalogs';
import { seedCompanies } from './seed/companies';
import { seedVacancies } from './seed/vacancies';
import { seedCandidates } from './seed/candidates';
import { seedCandidateVacancies } from './seed/candidate-vacancies';

config();

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  await db.transaction(async (tx) => {
    // --- Organization ---
    const existingOrg = await tx.query.organizations.findFirst({
      where: eq(organizations.name, 'Seed Organization'),
      columns: { id: true },
    });
    let organizationId: number;
    if (existingOrg) {
      console.log(`Organization "Seed Organization" already exists (id=${existingOrg.id}), skipping`);
      organizationId = existingOrg.id;
    } else {
      const [org] = await tx
        .insert(organizations)
        .values({ name: 'Seed Organization' })
        .returning({ id: organizations.id });
      if (!org) throw new Error('Organization insert failed');
      console.log(`Organization "Seed Organization" created (id=${org.id})`);
      organizationId = org.id;
    }

    // --- Permissions & Roles ---
    const { adminRoleId } = await seedPermissionsAndRoles(tx, organizationId);

    // --- Users ---
    const { userId } = await seedUsers(tx, organizationId, adminRoleId);

    // --- Catalogs (areas, industries, seniorities, statuses, sources, files) ---
    const catalogs = await seedCatalogs(tx, organizationId);

    // --- Companies ---
    const { companyIds } = await seedCompanies(tx, organizationId);

    // --- Vacancies ---
    const { vacancyIds } = await seedVacancies(tx, {
      organizationId,
      userId,
      vacancyStatusIds: catalogs.vacancyStatusIds,
      companyIds,
      areaIds: catalogs.areaIds,
      industryIds: catalogs.industryIds,
      seniorityIds: catalogs.seniorityIds,
    });

    // --- Candidates ---
    await seedCandidates(tx, {
      organizationId,
      userId,
      areaIds: catalogs.areaIds,
      industryIds: catalogs.industryIds,
      seniorityIds: catalogs.seniorityIds,
      candidateSourceIds: catalogs.candidateSourceIds,
      candidateFileId: catalogs.candidateFileId,
    });

    // --- Candidate-Vacancy Assignments ---
    await seedCandidateVacancies(tx, {
      organizationId,
      vacancyIds,
      candidateVacancyStatusIds: catalogs.candidateVacancyStatusIds,
    });
  });

  console.log('Database seeded successfully.');
  await pool.end();
}

main().catch((error) => {
  console.error('Error seeding database:', error);
  process.exit(1);
});
