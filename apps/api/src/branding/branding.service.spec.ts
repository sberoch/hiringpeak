import { PermissionCode } from '@workspace/shared/enums';
import { beforeEach, describe, expect, it } from 'vitest';
import { fixtures } from '../common/database/testing/fixtures';
import { createTestDatabase } from '../common/database/testing/test-database';
import { testServices } from '../common/database/testing/test-services';
import type { BrandingActor } from './branding.service';

let services: Awaited<ReturnType<typeof testServices>>;
let org: number;
let admin: BrandingActor;

const logoOf = (organizationId: number, name = 'logo') => ({
  logoUrl: `https://firebasestorage.googleapis.com/v0/b/hp.appspot.com/o/organizations%2F${organizationId}%2Fbranding%2F${name}.png?alt=media`,
  originalLogoUrl: `https://firebasestorage.googleapis.com/v0/b/hp.appspot.com/o/organizations%2F${organizationId}%2Fbranding%2F${name}-original.png?alt=media`,
});

beforeEach(async () => {
  const db = await createTestDatabase();
  services = await testServices(db);
  const f = fixtures(db);
  org = await f.organization();
  const userId = await f.user(org, [PermissionCode.ORGANIZATION_MANAGE]);
  admin = {
    organizationId: org,
    userId,
    codes: [PermissionCode.ORGANIZATION_MANAGE],
  };
});

describe('BrandingService', () => {
  it('reads back the logo an administrator set', async () => {
    await services.branding.update(admin, logoOf(org));

    expect(await services.branding.get(org)).toEqual({
      ...logoOf(org),
      accentColor: null,
    });
  });
});
