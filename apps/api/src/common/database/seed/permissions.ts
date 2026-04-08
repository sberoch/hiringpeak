/* eslint-disable */
import { and, eq } from 'drizzle-orm';
import { PermissionCode } from '@workspace/shared/enums';
import {
  permissions,
  roles,
  rolePermissions,
} from '@workspace/shared/schemas';
import { SeedTx } from './types';

const PERMISSION_SEED: { code: string; label: string; description: string }[] =
  [
    {
      code: PermissionCode.CANDIDATE_READ,
      label: 'Ver postulantes',
      description: 'Permite ver listado y detalle de postulantes',
    },
    {
      code: PermissionCode.CANDIDATE_MANAGE,
      label: 'Gestionar postulantes',
      description: 'Crear, editar y eliminar postulantes',
    },
    {
      code: PermissionCode.VACANCY_READ,
      label: 'Ver vacantes',
      description: 'Permite ver listado y detalle de vacantes',
    },
    {
      code: PermissionCode.VACANCY_MANAGE,
      label: 'Gestionar vacantes',
      description: 'Crear, editar y eliminar vacantes',
    },
    {
      code: PermissionCode.USER_READ,
      label: 'Ver usuarios',
      description: 'Ver usuarios de la organización',
    },
    {
      code: PermissionCode.USER_MANAGE,
      label: 'Gestionar usuarios',
      description: 'Crear y editar usuarios',
    },
    {
      code: PermissionCode.ROLE_MANAGE,
      label: 'Gestionar roles',
      description: 'Crear y asignar roles y permisos',
    },
    {
      code: PermissionCode.COMPANY_READ,
      label: 'Ver empresas',
      description: 'Ver empresas',
    },
    {
      code: PermissionCode.COMPANY_MANAGE,
      label: 'Gestionar empresas',
      description: 'Crear y editar empresas',
    },
    {
      code: PermissionCode.AREA_READ,
      label: 'Ver áreas',
      description: 'Ver áreas',
    },
    {
      code: PermissionCode.AREA_MANAGE,
      label: 'Gestionar áreas',
      description: 'Crear y editar áreas',
    },
    {
      code: PermissionCode.SETTINGS_READ,
      label: 'Ver configuración',
      description: 'Ver configuración de la organización',
    },
    {
      code: PermissionCode.SETTINGS_MANAGE,
      label: 'Gestionar configuración',
      description: 'Modificar configuración',
    },
    {
      code: PermissionCode.AUDIT_LOG_READ,
      label: 'Ver auditoría',
      description: 'Ver registro de auditoría',
    },
  ];

const ALL_PERMISSION_CODES = Object.values(PermissionCode);
const READ_ONLY_CODES = [
  PermissionCode.CANDIDATE_READ,
  PermissionCode.VACANCY_READ,
  PermissionCode.USER_READ,
  PermissionCode.COMPANY_READ,
  PermissionCode.AREA_READ,
  PermissionCode.SETTINGS_READ,
];
const MANAGER_CODES = ALL_PERMISSION_CODES.filter(
  (c) => c !== PermissionCode.ROLE_MANAGE,
);

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
    ALL_PERMISSION_CODES,
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
    READ_ONLY_CODES,
  );

  return { adminRoleId, managerRoleId, basicRoleId };
}
