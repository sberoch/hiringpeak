import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  companies,
  contacts,
  opportunities,
  opportunityContacts,
} from '@workspace/shared/schemas';
import { AuthzService } from '../auth/authz/authz.service';
import { DrizzleProvider } from '../common/database/drizzle.module';
import { LostReasonService } from '../lostreason/lostreason.service';
import { OpportunityStageService } from '../opportunitystage/opportunitystage.service';
import { PermissionService } from '../permission/permission.service';
import { RoleService } from '../role/role.service';
import { UserService } from '../user/user.service';
import { VacancyService } from '../vacancy/vacancy.service';
import { OpportunityService } from './opportunity.service';

type Row = Record<string, unknown>;
type Store = {
  companies: Row[];
  contacts: Row[];
  opportunities: Row[];
  opportunityContacts: Row[];
};

/**
 * In-memory stand-in for the Drizzle database (the boundary). Each fixture
 * holds a single Contact, so updates apply to every row of their table. A
 * transaction rolls the store back when its callback throws. `failInsertInto`
 * makes inserts into that table fail, to observe atomicity.
 */
function makeDb(store: Store, options: { failInsertInto?: unknown } = {}) {
  const tables = new Map<unknown, keyof Store>([
    [companies, 'companies'],
    [contacts, 'contacts'],
    [opportunities, 'opportunities'],
    [opportunityContacts, 'opportunityContacts'],
  ]);
  let nextId = 100;
  const stage = { id: 1, name: 'Primer contacto', isWon: false, isLost: false };

  const db: Record<string, unknown> = {
    insert: vi.fn((table: unknown) => ({
      values: vi.fn((row: Row) => {
        const write = () => {
          if (table === options.failInsertInto) throw new Error('db down');
          const saved = { id: nextId++, ...row };
          store[tables.get(table)!].push(saved);
          return [saved];
        };
        return {
          returning: vi.fn(async () => write()),
          then: (
            resolve: (v: unknown) => unknown,
            reject: (e: unknown) => unknown,
          ) => {
            try {
              return resolve(write());
            } catch (error) {
              return reject(error);
            }
          },
        };
      }),
    })),
    update: vi.fn((table: unknown) => ({
      set: vi.fn((set: Row) => ({
        where: vi.fn(() => {
          const rows = store[tables.get(table)!];
          rows.forEach((row) => Object.assign(row, set));
          return {
            returning: vi.fn(async () => rows),
            then: (r: (v: unknown) => unknown) => r(rows),
          };
        }),
      })),
    })),
    selectDistinct: vi.fn(() => {
      const node: Record<string, unknown> = {};
      for (const step of ['from', 'innerJoin', 'where']) {
        node[step] = vi.fn(() => node);
      }
      node.orderBy = vi.fn(async () => [
        { id: 7, name: 'Lucía', email: 'l@x.com' },
      ]);
      return node;
    }),
    // Open Tasks attached to Opportunities (next step): none in these fixtures.
    select: vi.fn(() => {
      const node: Record<string, unknown> = {};
      for (const step of ['from', 'innerJoin']) {
        node[step] = vi.fn(() => node);
      }
      node.where = vi.fn(async () => []);
      return node;
    }),
    query: {
      contacts: { findFirst: vi.fn(async () => store.contacts[0]) },
      companies: {
        findFirst: vi.fn(async () =>
          store.companies.find((company) => company.id === 9),
        ),
      },
      opportunityStages: { findFirst: vi.fn(async () => stage) },
      opportunities: {
        findFirst: vi.fn(async () => {
          const opportunity = store.opportunities.at(-1);
          return opportunity && { ...opportunity, stage, estimatedFee: null };
        }),
      },
    },
  };
  db.transaction = vi.fn(async (callback: (tx: unknown) => unknown) => {
    const snapshot = structuredClone(store);
    try {
      return await callback(db);
    } catch (error) {
      Object.assign(store, snapshot);
      throw error;
    }
  });
  return db;
}

async function makeService(db: Record<string, unknown>) {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      OpportunityService,
      AuthzService,
      OpportunityStageService,
      LostReasonService,
      { provide: VacancyService, useValue: {} },
      { provide: UserService, useValue: {} },
      { provide: RoleService, useValue: {} },
      { provide: PermissionService, useValue: {} },
      { provide: DrizzleProvider, useValue: db },
    ],
  }).compile();
  return module.get(OpportunityService);
}

const actor = { organizationId: 1, createdBy: 7 };

describe('OpportunityService.createFromContact', () => {
  let store: Store;

  beforeEach(() => {
    store = {
      companies: [
        { id: 4, name: 'Acme' },
        { id: 9, name: 'Initech' },
      ],
      contacts: [],
      opportunities: [],
      opportunityContacts: [],
    };
  });

  describe('from a Contact with a Company', () => {
    beforeEach(() => {
      store.contacts.push({ id: 3, name: 'Paula', companyId: 4 });
    });

    it("creates the Opportunity at the Contact's Company", async () => {
      const service = await makeService(makeDb(store));
      await service.createFromContact(3, { title: 'CFO search' }, actor);
      expect(store.opportunities[0]).toMatchObject({
        title: 'CFO search',
        companyId: 4,
      });
    });

    it('adds the Contact to the new Opportunity', async () => {
      const service = await makeService(makeDb(store));
      const created = await service.createFromContact(
        3,
        { title: 'CFO search' },
        actor,
      );
      expect(store.opportunityContacts).toEqual([
        { id: expect.any(Number), opportunityId: created.id, contactId: 3 },
      ]);
    });

    it('rejects another Company', async () => {
      const service = await makeService(makeDb(store));
      await expect(
        service.createFromContact(3, { title: 'CFO', companyId: 9 }, actor),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('from a Contact without a Company', () => {
    beforeEach(() => {
      store.contacts.push({ id: 3, name: 'Paula', companyId: null });
    });

    it('makes the chosen Company theirs and creates the Opportunity there', async () => {
      const service = await makeService(makeDb(store));
      await service.createFromContact(
        3,
        { title: 'CFO search', companyId: 9 },
        actor,
      );
      expect({
        contactCompany: store.contacts[0].companyId,
        opportunityCompany: store.opportunities[0].companyId,
      }).toEqual({ contactCompany: 9, opportunityCompany: 9 });
    });

    it('makes a new Company theirs and creates the Opportunity there', async () => {
      const service = await makeService(makeDb(store));
      await service.createFromContact(
        3,
        { title: 'CFO search', newCompanyName: 'Globex' },
        actor,
      );
      const globex = store.companies.find((c) => c.name === 'Globex');
      expect({
        contactCompany: store.contacts[0].companyId,
        opportunityCompany: store.opportunities[0].companyId,
      }).toEqual({
        contactCompany: globex?.id,
        opportunityCompany: globex?.id,
      });
    });

    it('leaves the Contact and Companies untouched when the Opportunity cannot be saved', async () => {
      const service = await makeService(
        makeDb(store, { failInsertInto: opportunityContacts }),
      );
      await expect(
        service.createFromContact(
          3,
          { title: 'CFO search', newCompanyName: 'Globex' },
          actor,
        ),
      ).rejects.toThrow();
      expect({
        contactCompany: store.contacts[0].companyId,
        companies: store.companies.length,
        opportunities: store.opportunities.length,
      }).toEqual({ contactCompany: null, companies: 2, opportunities: 0 });
    });

    it('requires a Company', async () => {
      const service = await makeService(makeDb(store));
      await expect(
        service.createFromContact(3, { title: 'CFO search' }, actor),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
