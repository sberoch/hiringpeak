import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { interactionContacts, interactions } from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import { InteractionService } from './interaction.service';

type ContactRow = {
  id: number;
  name: string;
  role: string;
  companyId: number | null;
};

/**
 * In-memory stand-in for the Drizzle database (the boundary), holding one
 * Organization's Contacts and the Interactions written through the service.
 * Queries ignore their `where`: each test seeds only the rows it involves.
 */
function makeDb(seed: { contacts: ContactRow[] }) {
  const state = {
    contacts: seed.contacts,
    interactions: [] as Record<string, unknown>[],
    links: [] as { interactionId: number; contactId: number }[],
  };

  const write = (table: unknown, rows: Record<string, unknown>[]) => {
    if (table === interactions) {
      const created = rows.map((row) => ({
        id: state.interactions.length + 1,
        ...row,
      }));
      state.interactions.push(...created);
      return created;
    }
    if (table === interactionContacts) {
      state.links.push(
        ...(rows as { interactionId: number; contactId: number }[]),
      );
    }
    return rows;
  };

  const resolved = <T>(value: T) => ({
    returning: vi.fn(async () => value),
    then: (resolve: (v: T) => unknown) => resolve(value),
  });

  const db: Record<string, unknown> = {
    insert: vi.fn((table: unknown) => ({
      values: vi.fn(
        (values: Record<string, unknown> | Record<string, unknown>[]) =>
          resolved(write(table, Array.isArray(values) ? values : [values])),
      ),
    })),
    update: vi.fn(() => ({
      set: vi.fn((set: Record<string, unknown>) => ({
        where: vi.fn(() => {
          Object.assign(state.interactions[0], set);
          return resolved([state.interactions[0]]);
        }),
      })),
    })),
    delete: vi.fn((table: unknown) => ({
      where: vi.fn(() => {
        if (table === interactionContacts) state.links = [];
        return resolved([]);
      }),
    })),
    query: {
      contacts: { findMany: vi.fn(async () => state.contacts) },
      companies: { findFirst: vi.fn(async () => ({ id: 7 })) },
      opportunities: { findFirst: vi.fn(async () => undefined) },
      interactions: {
        findFirst: vi.fn(async () => {
          const row = state.interactions[0];
          if (!row) return undefined;
          return {
            ...row,
            createdAt: new Date('2026-10-15T12:00:00Z'),
            company: null,
            opportunity: null,
            createdByUser: null,
            contacts: state.links.map((link) => ({
              contact: state.contacts.find((c) => c.id === link.contactId),
            })),
          };
        }),
      },
    },
  };
  db.transaction = vi.fn(async (cb: (tx: unknown) => unknown) => cb(db));
  return { db, state };
}

const partner = { organizationId: 1, userId: 7 };
const CALL = {
  type: 'call' as const,
  date: '2026-10-14',
  summary: 'Pidió bajar el fee.',
};

async function build(seed: { contacts: ContactRow[] }) {
  const fake = makeDb(seed);
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      InteractionService,
      { provide: DrizzleProvider, useValue: fake.db },
    ],
  }).compile();
  return { service: module.get(InteractionService), state: fake.state };
}

describe('InteractionService', () => {
  let service: InteractionService;
  let state: ReturnType<typeof makeDb>['state'];

  beforeEach(async () => {
    ({ service, state } = await build({
      contacts: [{ id: 3, name: 'Valeria Ruiz', role: 'CFO', companyId: 4 }],
    }));
  });

  it('stamps the Company from the Contacts’ current Company', async () => {
    const created = await service.create({ ...CALL, contactIds: [3] }, partner);
    expect(created.companyId).toBe(4);
  });

  it('keeps the Company at the time after the Contact moves to another Company', async () => {
    const created = await service.create({ ...CALL, contactIds: [3] }, partner);
    state.contacts[0].companyId = 9;

    const edited = await service.update(
      created.id,
      { summary: 'Pidió bajar el fee a $37M.', contactIds: [3] },
      partner,
    );
    expect(edited.companyId).toBe(4);
  });

  it('logs a Company-only Interaction', async () => {
    ({ service } = await build({ contacts: [] }));
    const created = await service.create({ ...CALL, companyId: 7 }, partner);
    expect(created).toMatchObject({ companyId: 7, contacts: [] });
  });

  it('rejects an Interaction with neither Contacts nor a Company', async () => {
    ({ service } = await build({ contacts: [] }));
    await expect(service.create({ ...CALL }, partner)).rejects.toThrow(
      BadRequestException,
    );
  });
});
