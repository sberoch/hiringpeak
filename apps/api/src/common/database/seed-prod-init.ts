/**
 * Production bootstrap seed. Run once on first deploy to get a usable database:
 *   - One organization
 *   - Permissions + Administrador / Manager / Basic roles
 *   - One admin user linked to the org + admin role
 *   - Reference catalogs (areas, industries, seniorities, vacancy statuses, etc.)
 *
 * Idempotent: every insert uses findOrCreate semantics, so running twice is safe.
 * Does NOT insert fixture data (companies, vacancies, candidates, sample resumes).
 *
 * Admin credentials come from env: ADMIN_EMAIL, ADMIN_PASSWORD, ORG_NAME.
 */
import { config } from 'dotenv';
import { and, eq, isNull } from 'drizzle-orm';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@workspace/shared/schemas';
import {
  hashPassword,
  organizations,
  users,
} from '@workspace/shared/schemas';
import { UserType } from '@workspace/shared/enums';

import { seedPermissionsAndRoles } from './seed/permissions';
import { seedCatalogs } from './seed/catalogs';
import { SeedTx } from './seed/types';

config();

async function findOrCreateOrganization(tx: SeedTx, name: string) {
  const existing = await tx.query.organizations.findFirst({
    where: eq(organizations.name, name),
    columns: { id: true },
  });
  if (existing) {
    console.log(`Organization "${name}" already exists (id=${existing.id})`);
    return existing.id;
  }
  const [row] = await tx
    .insert(organizations)
    .values({ name })
    .returning({ id: organizations.id });
  if (!row) throw new Error('Organization insert failed');
  console.log(`Organization "${name}" created (id=${row.id})`);
  return row.id;
}

async function findOrCreateUser(
  tx: SeedTx,
  values: typeof users.$inferInsert,
) {
  const orgId = (values as { organizationId?: number | null })
    .organizationId;
  const where = orgId
    ? and(eq(users.email, values.email), eq(users.organizationId, orgId))
    : and(eq(users.email, values.email), isNull(users.organizationId));

  const existing = await tx.query.users.findFirst({
    where,
    columns: { id: true },
  });
  if (existing) {
    console.log(
      `User "${values.email}" already exists (id=${existing.id}), skipping`,
    );
    return existing.id;
  }
  const [row] = await tx.insert(users).values(values).returning({
    id: users.id,
  });
  if (!row) throw new Error(`User insert failed for ${values.email}`);
  console.log(`User "${values.email}" created (id=${row.id})`);
  return row.id;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@hiringpeak.com';
  const adminPassword = process.env.ADMIN_PASSWORD;
  const orgName = process.env.ORG_NAME ?? 'Hiringpeak';

  if (!adminPassword) {
    throw new Error(
      'ADMIN_PASSWORD is not set. Refusing to bootstrap prod without an explicit admin password.',
    );
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  await db.transaction(async (tx) => {
    const organizationId = await findOrCreateOrganization(tx, orgName);

    const { adminRoleId } = await seedPermissionsAndRoles(tx, organizationId);

    const hashedPassword = await hashPassword(adminPassword);
    await findOrCreateUser(tx, {
      email: adminEmail,
      password: hashedPassword,
      name: 'Admin',
      active: true,
      organizationId,
      roleId: adminRoleId,
      userType: UserType.END_USER,
    } as typeof users.$inferInsert);

    await seedCatalogs(tx, organizationId, { includeFixtures: false });
  });

  console.log('Production bootstrap complete.');
  await pool.end();
}

main().catch((error) => {
  console.error('Error bootstrapping production database:', error);
  process.exit(1);
});
