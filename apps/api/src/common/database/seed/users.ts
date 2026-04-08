/* eslint-disable */
import { and, eq, isNull } from 'drizzle-orm';
import { UserType } from '@workspace/shared/enums';
import { hashPassword, users } from '@workspace/shared/schemas';
import { SeedTx } from './types';

async function findOrCreateUser(
  tx: SeedTx,
  values: typeof users.$inferInsert,
) {
  const orgId = (values as any).organizationId as number | null | undefined;
  const where = orgId
    ? and(eq(users.email, values.email), eq(users.organizationId, orgId))
    : and(eq(users.email, values.email), isNull(users.organizationId));

  const existing = await tx.query.users.findFirst({
    where,
    columns: { id: true },
  });
  if (existing) {
    console.log(`  User "${values.email}" already exists (id=${existing.id}), skipping`);
    return existing.id;
  }

  const [row] = await tx
    .insert(users)
    .values(values)
    .returning({ id: users.id });
  if (!row) throw new Error(`User insert failed for ${values.email}`);
  console.log(`  User "${values.email}" created (id=${row.id})`);
  return row.id;
}

export async function seedUsers(
  tx: SeedTx,
  organizationId: number,
  adminRoleId: number,
) {
  console.log('Seeding users...');
  const hashedPassword = await hashPassword('12345678');

  const userId = await findOrCreateUser(tx, {
    email: 'admin@gmail.com',
    password: hashedPassword,
    name: 'Admin',
    active: true,
    organizationId,
    roleId: adminRoleId,
    userType: UserType.END_USER,
  } as typeof users.$inferInsert);

  const sysAdminId = await findOrCreateUser(tx, {
    email: 'sysadmin@example.com',
    password: hashedPassword,
    name: 'System Admin',
    active: true,
    organizationId: null,
    userType: UserType.INTERNAL_USER,
  } as typeof users.$inferInsert);

  return { userId, sysAdminId };
}
