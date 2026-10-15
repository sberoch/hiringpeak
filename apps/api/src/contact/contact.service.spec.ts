import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PermissionCode } from '@workspace/shared/enums';
import { companies } from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import { UserService } from '../user/user.service';
import { ContactService } from './contact.service';

/**
 * Mocked Drizzle database (the boundary). `network` is the Organization's
 * existing Contacts, `commercialUsers` the users with commercial access; the
 * insert echoes back what the service wrote (new Companies get id 50, new
 * Contacts id 99).
 */
function makeDb(state: {
  network: Record<string, unknown>[];
  commercialUsers: { id: number; name: string; email: string }[];
}) {
  const chain = (result: unknown) => {
    const node: Record<string, unknown> = {};
    for (const step of ['from', 'leftJoin', 'innerJoin', 'where']) {
      node[step] = vi.fn(() => node);
    }
    node.orderBy = vi.fn(() => Promise.resolve(result));
    node.then = (resolve: (value: unknown) => unknown) => resolve(result);
    return node;
  };
  const db: Record<string, unknown> = {
    select: vi.fn(() => chain(state.network)),
    selectDistinct: vi.fn(() => chain(state.commercialUsers)),
    insert: vi.fn((table: unknown) => ({
      values: vi.fn((row: Record<string, unknown>) => ({
        returning: vi.fn(async () => [
          { id: table === companies ? 50 : 99, ...row },
        ]),
      })),
    })),
    query: {
      companies: { findFirst: vi.fn(async () => ({ id: 4 })) },
      contactSources: { findFirst: vi.fn(async () => ({ id: 1 })) },
    },
  };
  db.transaction = vi.fn(async (cb: (tx: unknown) => unknown) => cb(db));
  return db;
}

const partner = {
  organizationId: 1,
  userId: 7,
  codes: [PermissionCode.CRM_MANAGE],
};

describe('ContactService.create', () => {
  let db: ReturnType<typeof makeDb>;
  let service: ContactService;

  beforeEach(async () => {
    db = makeDb({
      network: [
        {
          id: 3,
          name: 'Paula Ibáñez',
          role: 'CFO',
          email: 'paula@acme.com',
          linkedin: null,
          companyId: 4,
          companyName: 'Acme',
        },
      ],
      commercialUsers: [{ id: 7, name: 'Lucía', email: 'lucia@x.com' }],
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactService,
        UserService,
        { provide: DrizzleProvider, useValue: db },
      ],
    }).compile();
    service = module.get(ContactService);
  });

  it('returns probable duplicates alongside the created Contact', async () => {
    const created = await service.create(
      { name: 'Paula Ibanez', email: 'otra@globex.com' },
      partner,
    );
    expect(created.duplicates).toEqual([
      {
        id: 3,
        name: 'Paula Ibáñez',
        role: 'CFO',
        company: { id: 4, name: 'Acme' },
        reason: 'name',
      },
    ]);
  });

  it('creates a Contact without a Company, owned by its creator', async () => {
    const created = await service.create({ name: 'Martín Gómez' }, partner);
    expect(created).toMatchObject({ id: 99, companyId: null, ownerId: 7 });
  });

  it('creates the Contact on a new Company created by name', async () => {
    const created = await service.create(
      { name: 'Martín Gómez', newCompanyName: 'Globex' },
      partner,
    );
    expect(created.companyId).toBe(50);
  });

  it('rejects an owner without commercial access', async () => {
    await expect(
      service.create({ name: 'Martín Gómez', ownerId: 5 }, partner),
    ).rejects.toThrow(BadRequestException);
  });
});
