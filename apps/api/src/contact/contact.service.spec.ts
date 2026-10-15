import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PermissionCode } from '@workspace/shared/enums';
import { companies, taskContacts, tasks } from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import { AuthzService } from '../auth/authz/authz.service';
import { PermissionService } from '../permission/permission.service';
import { RoleService } from '../role/role.service';
import { UserService } from '../user/user.service';
import { NotificationFactory } from '../notification/notification-factory';
import { TaskService } from '../task/task.service';
import { ContactService } from './contact.service';

/**
 * Mocked Drizzle database (the boundary). `network` is the Organization's
 * existing Contacts, `commercialUsers` the users with commercial access; the
 * insert echoes back what the service wrote (new Companies get id 50, new
 * Contacts id 99, new Tasks id 300) and is recorded in `inserted`.
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
  const inserted: { table: unknown; rows: unknown }[] = [];
  const ids = new Map<unknown, number>([
    [companies, 50],
    [tasks, 300],
  ]);
  const db: Record<string, unknown> = {
    inserted,
    select: vi.fn(() => chain(state.network)),
    selectDistinct: vi.fn(() => chain(state.commercialUsers)),
    insert: vi.fn((table: unknown) => ({
      values: vi.fn((rows: Record<string, unknown>) => {
        inserted.push({ table, rows });
        return {
          returning: vi.fn(async () => [{ id: ids.get(table) ?? 99, ...rows }]),
        };
      }),
    })),
    query: {
      companies: { findFirst: vi.fn(async () => ({ id: 4 })) },
      contactSources: { findFirst: vi.fn(async () => ({ id: 1 })) },
    },
  };
  db.transaction = vi.fn(async (cb: (tx: unknown) => unknown) => cb(db));
  return db;
}

const insertsInto = (db: ReturnType<typeof makeDb>, table: unknown) =>
  (db.inserted as { table: unknown; rows: unknown }[])
    .filter((insert) => insert.table === table)
    .map((insert) => insert.rows);

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
      commercialUsers: [
        { id: 7, name: 'Lucía', email: 'lucia@x.com' },
        { id: 8, name: 'Tomás', email: 'tomas@x.com' },
      ],
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactService,
        AuthzService,
        // AuthzService's own collaborators; listing commercial users only reads the db.
        { provide: UserService, useValue: {} },
        { provide: RoleService, useValue: {} },
        { provide: PermissionService, useValue: {} },
        { provide: DrizzleProvider, useValue: db },
        TaskService,
        { provide: NotificationFactory, useValue: { ensure: vi.fn() } },
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

  describe('"Abordar en X días"', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 9, 15, 10, 0));
    });
    afterEach(() => vi.useRealTimers());

    it('schedules a follow-up due today + X, owned by the Contact Owner', async () => {
      await service.create(
        { name: 'Martín Gómez', ownerId: 8, followUpInDays: 7 },
        partner,
      );
      expect(insertsInto(db, tasks)).toEqual([
        expect.objectContaining({
          title: 'Abordar a Martín',
          dueDate: '2026-10-22',
          assignedTo: 8,
          createdBy: 7,
        }),
      ]);
    });

    it('attaches the follow-up to the new Contact', async () => {
      await service.create(
        { name: 'Martín Gómez', followUpInDays: 30 },
        partner,
      );
      expect(insertsInto(db, taskContacts)).toEqual([
        [{ taskId: 300, contactId: 99 }],
      ]);
    });

    it('gives the follow-up to its creator when the Contact has no owner', async () => {
      await service.create(
        { name: 'Martín Gómez', ownerId: null, followUpInDays: 3 },
        partner,
      );
      expect(insertsInto(db, tasks)).toEqual([
        expect.objectContaining({ assignedTo: 7, dueDate: '2026-10-18' }),
      ]);
    });

    it('schedules nothing without it', async () => {
      await service.create({ name: 'Martín Gómez' }, partner);
      expect(insertsInto(db, tasks)).toEqual([]);
    });
  });

  it('rejects an owner without commercial access', async () => {
    await expect(
      service.create({ name: 'Martín Gómez', ownerId: 5 }, partner),
    ).rejects.toThrow(BadRequestException);
  });
});
