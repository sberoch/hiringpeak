import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PermissionCode } from '@workspace/shared/enums';
import { beforeEach, describe, expect, it } from 'vitest';
import { fixtures } from '../common/database/testing/fixtures';
import { createTestDatabase } from '../common/database/testing/test-database';
import { testServices } from '../common/database/testing/test-services';
import type { BrandingActor } from './branding.service';

let services: Awaited<ReturnType<typeof testServices>>;
let org: number;
let f: ReturnType<typeof fixtures>;
let admin: BrandingActor;

const logoOf = (organizationId: number, name = 'logo') => ({
  logoUrl: `https://firebasestorage.googleapis.com/v0/b/hp.appspot.com/o/organizations%2F${organizationId}%2Fbranding%2F${name}.png?alt=media`,
  originalLogoUrl: `https://firebasestorage.googleapis.com/v0/b/hp.appspot.com/o/organizations%2F${organizationId}%2Fbranding%2F${name}-original.png?alt=media`,
});

beforeEach(async () => {
  const db = await createTestDatabase();
  services = await testServices(db);
  f = fixtures(db);
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

  it('goes back to no logo once the logo is removed', async () => {
    await services.branding.update(admin, logoOf(org));

    await services.branding.removeLogo(admin);

    expect(await services.branding.get(org)).toEqual({
      logoUrl: null,
      originalLogoUrl: null,
      accentColor: null,
    });
  });

  it('records every change, including removing the logo, in the audit log', async () => {
    await services.branding.update(admin, logoOf(org));
    await services.branding.removeLogo(admin);

    const page = await services.auditLog.findAll({
      organizationId: org,
      commercialAccess: false,
    });
    expect(
      page.items.map(({ eventType, entityType, entityId, actorUserId }) => ({
        eventType,
        entityType,
        entityId,
        actorUserId,
      })),
    ).toEqual([
      {
        eventType: 'update_branding',
        entityType: 'organization',
        entityId: org,
        actorUserId: admin.userId,
      },
      {
        eventType: 'update_branding',
        entityType: 'organization',
        entityId: org,
        actorUserId: admin.userId,
      },
    ]);
  });

  describe('accent color', () => {
    it('reads back a readable accent color an administrator set', async () => {
      await services.branding.updateAccent(admin, { accentColor: '#1A1A2E' });

      expect((await services.branding.get(org)).accentColor).toBe('#1a1a2e');
    });

    it('rejects an accent color readable with neither black nor white text', async () => {
      await expect(
        services.branding.updateAccent(admin, { accentColor: '#777777' }),
      ).rejects.toThrow(/ni con texto negro ni con texto blanco/);
      expect((await services.branding.get(org)).accentColor).toBeNull();
    });

    it('rejects an accent color that is not #RRGGBB', async () => {
      await expect(
        services.branding.updateAccent(admin, { accentColor: 'blue' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('goes back to no accent color once it is cleared', async () => {
      await services.branding.updateAccent(admin, { accentColor: '#ffd400' });

      await services.branding.removeAccent(admin);

      expect((await services.branding.get(org)).accentColor).toBeNull();
    });

    it('records saving and clearing the accent color in the audit log', async () => {
      await services.branding.updateAccent(admin, { accentColor: '#ffd400' });
      await services.branding.removeAccent(admin);

      const page = await services.auditLog.findAll({
        organizationId: org,
        commercialAccess: false,
      });
      expect(page.items.map((event) => event.eventType)).toEqual([
        'update_branding',
        'update_branding',
      ]);
    });

    it('cannot be set without ORGANIZATION_MANAGE', async () => {
      await expect(
        services.branding.updateAccent(
          { ...admin, codes: [PermissionCode.SETTINGS_MANAGE] },
          { accentColor: '#ffd400' },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('across Organizations', () => {
    let other: number;

    beforeEach(async () => {
      other = await f.organization();
    });

    it("never reads another Organization's logo", async () => {
      await services.branding.update(admin, logoOf(org));

      expect((await services.branding.get(other)).logoUrl).toBeNull();
    });

    it("rejects a logo stored under another Organization's path", async () => {
      await expect(
        services.branding.update(admin, logoOf(other)),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  it('rejects a logo stored outside the Branding path', async () => {
    await expect(
      services.branding.update(admin, {
        logoUrl: 'https://example.com/logo.png',
        originalLogoUrl: 'https://example.com/logo-original.png',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  describe('without ORGANIZATION_MANAGE', () => {
    let member: BrandingActor;

    beforeEach(() => {
      member = {
        ...admin,
        codes: [PermissionCode.SETTINGS_MANAGE, PermissionCode.ROLE_MANAGE],
      };
    });

    it('cannot set the logo', async () => {
      await expect(
        services.branding.update(member, logoOf(org)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('cannot remove the logo', async () => {
      await services.branding.update(admin, logoOf(org));

      await expect(services.branding.removeLogo(member)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect((await services.branding.get(org)).logoUrl).toBe(
        logoOf(org).logoUrl,
      );
    });
  });
});
