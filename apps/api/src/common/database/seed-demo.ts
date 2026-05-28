/**
 * Demo environment seed. Layers fixture data on top of a bootstrapped database:
 *   - Companies, vacancies, candidates and candidate-vacancy assignments
 *   - The resume.pdf candidate-file fixture (skipped by the prod bootstrap)
 *
 * Run `pnpm run db:seed:prod` FIRST — this seed expects the organization, roles
 * and at least one admin user to already exist, and will error out otherwise.
 *
 * Idempotent: every insert uses findOrCreate semantics, so running twice is safe.
 * Org name comes from env: ORG_NAME (defaults to the bootstrap org).
 *
 * Run via: pnpm run db:seed:demo (tsx src/common/database/seed-demo.ts)
 */
import { config } from 'dotenv';
import { and, asc, eq } from 'drizzle-orm';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@workspace/shared/schemas';
import { organizations, users } from '@workspace/shared/schemas';

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
  const orgName = process.env.ORG_NAME ?? 'Hiringpeak';
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@hiringpeak.com';

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  await db.transaction(async (tx) => {
    // --- Organization (must already exist) ---
    const org = await tx.query.organizations.findFirst({
      where: eq(organizations.name, orgName),
      columns: { id: true },
    });
    if (!org) {
      throw new Error(
        `Organization "${orgName}" not found. Run "pnpm run db:seed:prod" first.`,
      );
    }
    const organizationId = org.id;
    console.log(`Seeding demo data into "${orgName}" (id=${organizationId})`);

    // --- Creator user: prefer the bootstrap admin, else the org's first user ---
    let creator = await tx.query.users.findFirst({
      where: and(
        eq(users.email, adminEmail),
        eq(users.organizationId, organizationId),
      ),
      columns: { id: true },
    });
    if (!creator) {
      creator = await tx.query.users.findFirst({
        where: eq(users.organizationId, organizationId),
        columns: { id: true },
        orderBy: asc(users.id),
      });
    }
    if (!creator) {
      throw new Error(
        `No user found in "${orgName}". Run "pnpm run db:seed:prod" first.`,
      );
    }
    const userId = creator.id;

    // --- Catalogs WITH fixtures (ensures the resume.pdf candidate-file exists) ---
    const catalogs = await seedCatalogs(tx, organizationId, {
      includeFixtures: true,
    });
    if (catalogs.candidateFileId == null) {
      throw new Error('Demo seed expects a fixture candidateFileId');
    }

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

  console.log('Demo environment seeded successfully.');
  await pool.end();
}

main().catch((error) => {
  console.error('Error seeding demo environment:', error);
  process.exit(1);
});
