 
import { and, eq } from 'drizzle-orm';
import {
  permissions,
  roles,
  rolePermissions,
} from '@workspace/shared/schemas';
import {
  ADMINISTRADOR_CODES,
  BASIC_CODES,
  MANAGER_CODES,
  PERMISSION_SEED,
} from '../../../permission/permission-catalogue';
import { SeedTx } from './types';

function getPermissionIds(
  codeToId: Map<string, number>,
  codes: string[],
): number[] {
  return codes
    .map((c) => codeToId.get(c))
    .filter((id): id is number => id != null);
}

async function findOrCreateRole(
  tx: SeedTx,
  name: string,
  organizationId: number,
  permissionIdsByCode: Map<string, number>,
  codes: string[],
) {
  const existing = await tx.query.roles.findFirst({
    where: and(eq(roles.name, name), eq(roles.organizationId, organizationId)),
    columns: { id: true },
  });
  if (existing) {
    console.log(`  Role "${name}" already exists (id=${existing.id}), skipping`);
    return existing.id;
  }

  const [row] = await tx
    .insert(roles)
    .values({ name, organizationId } as typeof roles.$inferInsert)
    .returning({ id: roles.id });
  if (!row) throw new Error(`Failed to create ${name} role`);
  console.log(`  Role "${name}" created (id=${row.id})`);

  const permIds = getPermissionIds(permissionIdsByCode, codes);
  if (permIds.length > 0) {
    await tx
      .insert(rolePermissions)
      .values(
        permIds.map((permissionId) => ({
          roleId: row.id,
          permissionId,
        })),
      )
      .onConflictDoNothing();
  }

  return row.id;
}

export async function seedPermissionsAndRoles(
  tx: SeedTx,
  organizationId: number,
) {
  console.log('Seeding permissions...');
  let permCreated = 0;
  let permSkipped = 0;
  const permissionIdsByCode = new Map<string, number>();
  for (const { code, label, description } of PERMISSION_SEED) {
    const existing = await tx.query.permissions.findFirst({
      where: eq(permissions.code, code),
      columns: { id: true },
    });
    if (existing) {
      permissionIdsByCode.set(code, existing.id);
      permSkipped++;
      continue;
    }
    const [row] = await tx
      .insert(permissions)
      .values({ code, label, description } as typeof permissions.$inferInsert)
      .returning({ id: permissions.id });
    if (row) {
      permissionIdsByCode.set(code, row.id);
      permCreated++;
    }
  }
  console.log(`  Permissions: ${permCreated} created, ${permSkipped} already existed`);

  console.log('Seeding roles...');
  const adminRoleId = await findOrCreateRole(
    tx,
    'Administrador',
    organizationId,
    permissionIdsByCode,
    ADMINISTRADOR_CODES,
  );
  const managerRoleId = await findOrCreateRole(
    tx,
    'Manager',
    organizationId,
    permissionIdsByCode,
    MANAGER_CODES,
  );
  const basicRoleId = await findOrCreateRole(
    tx,
    'Basic',
    organizationId,
    permissionIdsByCode,
    BASIC_CODES,
  );

  return { adminRoleId, managerRoleId, basicRoleId };
}
