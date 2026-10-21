import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PermissionCode } from '@workspace/shared/enums';
import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { fixtures } from '../common/database/testing/fixtures';
import { createTestDatabase } from '../common/database/testing/test-database';
import { testServices } from '../common/database/testing/test-services';
import type { DrizzleDatabase } from '../common/database/types/drizzle';

/** Branding needs someone who can manage the Organization from day one. */
let db: DrizzleDatabase;
let services: Awaited<ReturnType<typeof testServices>>;
let f: ReturnType<typeof fixtures>;
let org: number;

beforeEach(async () => {
  db = await createTestDatabase();
  services = await testServices(db);
  f = fixtures(db);
  org = await f.organization();
});

const codesOf = async (roleId: number) =>
  services.authz.getPermissionCodesForUser(await f.member(org, roleId));

describe('ORGANIZATION_MANAGE on default Roles', () => {
  it("is carried by a new Organization's Administrador", async () => {
    const { administradorRoleId } =
      await services.roles.createDefaultRolesForOrganization(org);

    expect(await codesOf(administradorRoleId)).toContain(
      PermissionCode.ORGANIZATION_MANAGE,
    );
  });

  it("is not carried by a new Organization's Manager", async () => {
    const { managerRoleId } =
      await services.roles.createDefaultRolesForOrganization(org);

    expect(await codesOf(managerRoleId)).not.toContain(
      PermissionCode.ORGANIZATION_MANAGE,
    );
  });

  describe('for Organizations created before it existed', () => {
    const migrate = async () => {
      const file = join(
        __dirname,
        '../../drizzle/0016_organization_manage_permission.sql',
      );
      for (const statement of readFileSync(file, 'utf8').split(
        '--> statement-breakpoint',
      )) {
        await db.execute(sql.raw(statement));
      }
    };

    it('is added to the existing Administrador Role', async () => {
      const role = await services.roles.create(
        { name: 'Administrador', permissionIds: [] },
        org,
      );

      await migrate();

      expect(await codesOf(role.id)).toEqual([
        PermissionCode.ORGANIZATION_MANAGE,
      ]);
    });

    it('is not added to other Roles', async () => {
      const role = await services.roles.create(
        { name: 'Manager', permissionIds: [] },
        org,
      );

      await migrate();

      expect(await codesOf(role.id)).toEqual([]);
    });
  });
});
