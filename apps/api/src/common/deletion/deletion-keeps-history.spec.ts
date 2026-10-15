import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { PermissionCode } from '@workspace/shared/enums';
import {
  companies,
  contacts,
  interactionContacts,
  interactions,
  opportunities,
  opportunityContacts,
  taskContacts,
  tasks,
  vacancies,
} from '@workspace/shared/schemas';
import { AuthzService } from '../../auth/authz/authz.service';
import { CompanyService } from '../../company/company.service';
import { ContactService } from '../../contact/contact.service';
import { LostReasonService } from '../../lostreason/lostreason.service';
import { NotificationFactory } from '../../notification/notification-factory';
import { OpportunityService } from '../../opportunity/opportunity.service';
import { OpportunityStageService } from '../../opportunitystage/opportunitystage.service';
import { PermissionService } from '../../permission/permission.service';
import { RoleService } from '../../role/role.service';
import { TaskService } from '../../task/task.service';
import { UserService } from '../../user/user.service';
import { VacancyService } from '../../vacancy/vacancy.service';
import { DrizzleProvider } from '../database/drizzle.module';

type Row = Record<string, unknown>;
type Write = {
  op: 'update' | 'delete';
  table: unknown;
  set?: Row;
  params: unknown[];
};

const dialect = new PgDialect();
const paramsOf = (where?: SQL) =>
  where ? dialect.sqlToQuery(where).params : [];

/**
 * Mocked Drizzle database (the boundary). Reads return the fixture rows of
 * the table they select `from` (`interactions` rows are one per involved
 * Contact, `contactId` null when there are none); every update and delete is
 * recorded in `writes`, with the parameters of its `where`.
 */
function makeDb(fixtures: {
  opportunity?: Row;
  contact?: Row;
  company?: Row;
  reads?: Map<unknown, Row[]>;
}) {
  const writes: Write[] = [];
  const db: Record<string, unknown> = {
    writes,
    select: vi.fn(() => {
      let rows: Row[] = [];
      const node: Record<string, unknown> = {
        from: vi.fn((table: unknown) => {
          rows = fixtures.reads?.get(table) ?? [];
          return node;
        }),
        then: (resolve: (value: unknown) => unknown) => resolve(rows),
      };
      for (const step of ['leftJoin', 'innerJoin', 'where', 'orderBy']) {
        node[step] = vi.fn(() => node);
      }
      return node;
    }),
    update: vi.fn((table: unknown) => ({
      set: vi.fn((set: Row) => ({
        where: vi.fn((where?: SQL) => {
          writes.push({ op: 'update', table, set, params: paramsOf(where) });
          return Promise.resolve([]);
        }),
      })),
    })),
    delete: vi.fn((table: unknown) => ({
      where: vi.fn((where?: SQL) => {
        writes.push({ op: 'delete', table, params: paramsOf(where) });
        const deleted = [
          fixtures.opportunity,
          fixtures.contact,
          fixtures.company,
        ].filter(Boolean);
        const result = Promise.resolve(deleted);
        return Object.assign(result, { returning: () => result });
      }),
    })),
    query: {
      opportunities: { findFirst: vi.fn(async () => fixtures.opportunity) },
      contacts: { findFirst: vi.fn(async () => fixtures.contact) },
      companies: { findFirst: vi.fn(async () => fixtures.company) },
    },
  };
  db.transaction = vi.fn(async (callback: (tx: unknown) => unknown) =>
    callback(db),
  );
  return db as Record<string, unknown> & { writes: Write[] };
}

/** What happened to a table: each write without its `where` parameters. */
const effectsOn = (db: { writes: Write[] }, table: unknown) =>
  db.writes
    .filter((write) => write.table === table)
    .map(({ op, set }) => (set ? { op, set } : { op }));

async function makeServices(db: Record<string, unknown>) {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      OpportunityService,
      ContactService,
      CompanyService,
      AuthzService,
      TaskService,
      OpportunityStageService,
      LostReasonService,
      { provide: VacancyService, useValue: {} },
      { provide: UserService, useValue: {} },
      { provide: RoleService, useValue: {} },
      { provide: PermissionService, useValue: {} },
      { provide: NotificationFactory, useValue: { ensure: vi.fn() } },
      { provide: DrizzleProvider, useValue: db },
    ],
  }).compile();
  return {
    opportunities: module.get(OpportunityService),
    contacts: module.get(ContactService),
    companies: module.get(CompanyService),
  };
}

describe('Deleting an Opportunity', () => {
  const opportunity = { id: 3, title: 'CFO search', company: { name: 'Acme' } };

  it('marks its Tasks as stayed commercial', async () => {
    const db = makeDb({ opportunity });
    const { opportunities: service } = await makeServices(db);
    await service.remove(3, 1);
    expect(effectsOn(db, tasks)).toEqual([
      { op: 'update', set: { stayedCommercial: true } },
    ]);
  });

  it('keeps its Interactions on the Company, without the Opportunity link', async () => {
    const db = makeDb({ opportunity });
    const { opportunities: service } = await makeServices(db);
    await service.remove(3, 1);
    expect(effectsOn(db, interactions)).toEqual([
      { op: 'update', set: { opportunityId: null } },
    ]);
  });

  it('keeps its Vacancies, unlinked', async () => {
    const db = makeDb({ opportunity });
    const { opportunities: service } = await makeServices(db);
    await service.remove(3, 1);
    expect(effectsOn(db, vacancies)).toEqual([
      { op: 'update', set: { opportunityId: null } },
    ]);
  });
});

describe('Deleting a Contact', () => {
  const contact = { id: 5, name: 'Paula', companyId: 4 };
  const partner = {
    organizationId: 1,
    userId: 7,
    codes: [PermissionCode.CRM_MANAGE],
  };

  it('marks their Tasks as stayed commercial', async () => {
    const db = makeDb({ contact });
    const { contacts: service } = await makeServices(db);
    await service.remove(5, partner);
    expect(effectsOn(db, tasks)).toEqual([
      { op: 'update', set: { stayedCommercial: true } },
    ]);
  });

  it('clears any Vacancy Contact pointing at them', async () => {
    const db = makeDb({ contact });
    const { contacts: service } = await makeServices(db);
    await service.remove(5, partner);
    expect(effectsOn(db, vacancies)).toEqual([
      { op: 'update', set: { vacancyContactId: null } },
    ]);
  });

  it('removes them from Interactions, Opportunities and Tasks without deleting those', async () => {
    const db = makeDb({ contact });
    const { contacts: service } = await makeServices(db);
    await service.remove(5, partner);
    const touched = [
      interactionContacts,
      opportunityContacts,
      taskContacts,
      interactions,
      opportunities,
    ].map((table) => effectsOn(db, table));
    expect(touched).toEqual([
      [{ op: 'delete' }],
      [{ op: 'delete' }],
      [{ op: 'delete' }],
      [],
      [],
    ]);
  });

  it('deletes only the Interactions left with neither Contacts nor a Company', async () => {
    const db = makeDb({
      contact,
      reads: new Map([
        [
          interactions,
          [
            // Only with Paula, and its Company is already gone.
            { id: 11, companyId: null, contactId: 5 },
            // Also with someone else.
            { id: 12, companyId: null, contactId: 5 },
            { id: 12, companyId: null, contactId: 6 },
            // Still on a Company.
            { id: 13, companyId: 4, contactId: 5 },
          ],
        ],
      ]),
    });
    const { contacts: service } = await makeServices(db);
    await service.remove(5, partner);
    const deleted = db.writes
      .filter((write) => write.op === 'delete' && write.table === interactions)
      .flatMap((write) => write.params);
    expect(deleted).toEqual([11]);
  });
});

describe('Deleting a Company', () => {
  const company = { id: 4, name: 'Acme' };

  it('keeps its Contacts, without a Company', async () => {
    const db = makeDb({ company });
    const { companies: service } = await makeServices(db);
    await service.remove(4, 1);
    expect(effectsOn(db, contacts)).toEqual([
      { op: 'update', set: { companyId: null } },
    ]);
  });

  it('deletes its Opportunities and Vacancies', async () => {
    const db = makeDb({ company });
    const { companies: service } = await makeServices(db);
    await service.remove(4, 1);
    const deletedTables = db.writes
      .filter((write) => write.op === 'delete')
      .map((write) => write.table);
    expect(deletedTables).toEqual(
      expect.arrayContaining([opportunities, vacancies, companies]),
    );
  });

  it('keeps Interactions with a Contact, without the Company, and deletes the Company-only ones', async () => {
    const db = makeDb({
      company,
      reads: new Map([
        [
          interactions,
          [
            { id: 21, companyId: 4, contactId: null },
            { id: 22, companyId: 4, contactId: 5 },
          ],
        ],
      ]),
    });
    const { companies: service } = await makeServices(db);
    await service.remove(4, 1);
    expect(
      db.writes
        .filter((write) => write.table === interactions)
        .map(({ op, set, params }) =>
          op === 'delete' ? { op, ids: params } : { op, set },
        ),
    ).toEqual([
      { op: 'delete', ids: [21] },
      { op: 'update', set: { companyId: null } },
    ]);
  });

  it("marks its Opportunities' Tasks as stayed commercial", async () => {
    const db = makeDb({
      company,
      reads: new Map([[opportunities, [{ id: 3 }]]]),
    });
    const { companies: service } = await makeServices(db);
    await service.remove(4, 1);
    expect(effectsOn(db, tasks)).toEqual([
      { op: 'update', set: { stayedCommercial: true } },
    ]);
  });
});
