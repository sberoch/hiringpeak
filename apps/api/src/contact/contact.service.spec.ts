import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InteractionType, PermissionCode } from '@workspace/shared/enums';
import {
  interactionContacts,
  interactions as interactionRows,
} from '@workspace/shared/schemas';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import type { InteractionService } from '../interaction/interaction.service';
import { fixtures } from '../common/database/testing/fixtures';
import {
  createTestDatabase,
  failInsertsInto,
} from '../common/database/testing/test-database';
import { testServices } from '../common/database/testing/test-services';
import type { TaskService } from '../task/task.service';
import type { ContactActor } from './contact.dto';
import type { ContactService } from './contact.service';

let db: DrizzleDatabase;
let contacts: ContactService;
let tasks: TaskService;
let interactions: InteractionService;
let f: ReturnType<typeof fixtures>;
let org: number;
let lucia: number;
let tomas: number;
let partner: ContactActor;

beforeEach(async () => {
  db = await createTestDatabase();
  ({ contacts, tasks, interactions } = await testServices(db));
  f = fixtures(db);
  org = await f.organization();
  lucia = await f.user(org, [PermissionCode.CRM_MANAGE], 'Lucía');
  tomas = await f.user(org, [PermissionCode.CRM_READ], 'Tomás');
  partner = {
    organizationId: org,
    userId: lucia,
    codes: [PermissionCode.CRM_MANAGE],
  };
});

/** The Tasks attached to a Contact (their follow-ups). */
const followUpsOf = async (contactId: number) =>
  (
    await tasks.findAll({
      organizationId: org,
      commercialAccess: true,
      contactId,
    })
  ).items;

describe('ContactService.create', () => {
  it('returns probable duplicates alongside the created Contact', async () => {
    const acme = await f.company(org, { name: 'Acme' });
    await contacts.create(
      { name: 'Paula Ibáñez', role: 'CFO', companyId: acme },
      partner,
    );

    const created = await contacts.create(
      { name: 'Paula Ibanez', email: 'otra@globex.com' },
      partner,
    );

    expect(created.duplicates).toEqual([
      {
        id: expect.any(Number),
        name: 'Paula Ibáñez',
        role: 'CFO',
        company: { id: acme, name: 'Acme' },
        reason: 'name',
      },
    ]);
  });

  it('creates a Contact without a Company, owned by its creator', async () => {
    const created = await contacts.create({ name: 'Martín Gómez' }, partner);
    expect(await contacts.findOne(created.id, org)).toMatchObject({
      company: null,
      owner: { id: lucia, name: 'Lucía' },
    });
  });

  it('creates the Contact on a new Company created by name', async () => {
    const created = await contacts.create(
      { name: 'Martín Gómez', newCompanyName: 'Globex' },
      partner,
    );
    expect(await contacts.findOne(created.id, org)).toMatchObject({
      company: { name: 'Globex' },
    });
  });

  describe('"Abordar en X días"', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 9, 15, 10, 0));
    });
    afterEach(() => vi.useRealTimers());

    it('schedules a follow-up on the new Contact due today + X, owned by the Contact Owner', async () => {
      const created = await contacts.create(
        { name: 'Martín Gómez', ownerId: tomas, followUpInDays: 7 },
        partner,
      );
      expect(await followUpsOf(created.id)).toEqual([
        expect.objectContaining({
          title: 'Abordar a Martín',
          dueDate: '2026-10-22',
          assignedTo: tomas,
          createdBy: lucia,
        }),
      ]);
    });

    it('gives the follow-up to its creator when the Contact has no owner', async () => {
      const created = await contacts.create(
        { name: 'Martín Gómez', ownerId: null, followUpInDays: 3 },
        partner,
      );
      expect(await followUpsOf(created.id)).toEqual([
        expect.objectContaining({ assignedTo: lucia, dueDate: '2026-10-18' }),
      ]);
    });

    it('schedules nothing without it', async () => {
      const created = await contacts.create({ name: 'Martín Gómez' }, partner);
      expect(await followUpsOf(created.id)).toEqual([]);
    });
  });

  it('rejects an owner without commercial access', async () => {
    const recruiter = await f.user(org, [PermissionCode.VACANCY_MANAGE]);
    await expect(
      contacts.create({ name: 'Martín Gómez', ownerId: recruiter }, partner),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('What Contact writes return', () => {
  let companyManager: ContactActor;
  let acme: number;
  beforeEach(async () => {
    acme = await f.company(org, { name: 'Acme' });
    companyManager = {
      organizationId: org,
      userId: await f.user(org, [PermissionCode.COMPANY_MANAGE]),
      codes: [PermissionCode.COMPANY_MANAGE],
    };
  });

  const basicFields = {
    companyId: expect.any(Number),
    name: 'Martín Gómez',
    role: '',
    email: null,
    phone: null,
    linkedin: null,
  };

  it('creating gives a Company manager without commercial access only the basic fields', async () => {
    const created = await contacts.create(
      { name: 'Martín Gómez', companyId: acme },
      companyManager,
    );
    expect(created).toEqual({
      id: expect.any(Number),
      ...basicFields,
      duplicates: [],
    });
  });

  it('editing gives a Company manager without commercial access only the basic fields', async () => {
    const contact = await f.contact(org, { name: 'Martín', companyId: acme });
    const updated = await contacts.update(
      contact,
      { name: 'Martín Gómez' },
      companyManager,
    );
    expect(updated).toEqual({ id: contact, ...basicFields });
  });

  it('deleting gives a Company manager without commercial access only the basic fields', async () => {
    const contact = await f.contact(org, {
      name: 'Martín Gómez',
      companyId: acme,
    });
    expect(await contacts.remove(contact, companyManager)).toEqual({
      id: contact,
      ...basicFields,
    });
  });

  it('editing gives a commercial user the network fields too', async () => {
    const contact = await f.contact(org, { name: 'Martín', companyId: acme });
    const updated = await contacts.update(
      contact,
      { shortDescription: 'Conocido de la feria' },
      partner,
    );
    expect(updated).toMatchObject({
      shortDescription: 'Conocido de la feria',
      ownerId: null,
      sourceId: null,
    });
  });
});

describe('Quick capture: a first Interaction with the new Contact', () => {
  const firstInteraction = {
    type: InteractionType.MEETING,
    date: '2026-10-14',
    summary: 'Nos conocimos en la feria',
  };

  it('is recorded with the Contact, at their Company', async () => {
    const acme = await f.company(org, { name: 'Acme' });
    const created = await contacts.create(
      { name: 'Martín Gómez', companyId: acme, firstInteraction },
      partner,
    );
    expect(await interactions.findAll({ contactId: created.id }, org)).toEqual([
      expect.objectContaining({
        ...firstInteraction,
        company: { id: acme, name: 'Acme' },
        contacts: [expect.objectContaining({ id: created.id })],
      }),
    ]);
  });

  it('is recorded at the Company created by name with the Contact', async () => {
    const created = await contacts.create(
      { name: 'Martín Gómez', newCompanyName: 'Globex', firstInteraction },
      partner,
    );
    const [interaction] = await interactions.findAll(
      { contactId: created.id },
      org,
    );
    expect(interaction.company?.name).toBe('Globex');
  });

  it('saves neither when the Interaction cannot be saved', async () => {
    // Fault injection at the database: recording any Interaction fails.
    await failInsertsInto('interactions');

    await expect(
      contacts.create({ name: 'Martín Gómez', firstInteraction }, partner),
    ).rejects.toThrow();
    expect(
      (
        await contacts.findAll({
          organizationId: org,
          viewer: { userId: lucia, readsAllTasks: true },
        })
      ).items,
    ).toEqual([]);
  });

  it('needs CRM_MANAGE', async () => {
    const companyManager = {
      organizationId: org,
      userId: await f.user(org, [PermissionCode.COMPANY_MANAGE]),
      codes: [PermissionCode.COMPANY_MANAGE],
    };
    const acme = await f.company(org);
    await expect(
      contacts.create(
        { name: 'Martín Gómez', companyId: acme, firstInteraction },
        companyManager,
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});

describe('ContactService.findAll — last Interaction', () => {
  it("ignores another Organization's Interactions", async () => {
    const paula = await f.contact(org, { name: 'Paula' });
    const otherOrg = await f.organization();
    // A stray link from another Organization's Interaction.
    const [stray] = await db
      .insert(interactionRows)
      .values({
        organizationId: otherOrg,
        type: InteractionType.CALL,
        date: '2026-10-01',
        summary: 'Ajena',
      })
      .returning();
    await db
      .insert(interactionContacts)
      .values({ interactionId: stray.id, contactId: paula });

    const page = await contacts.findAll({
      organizationId: org,
      viewer: { userId: lucia, readsAllTasks: true },
    });
    expect(page.items[0].lastInteraction).toBeNull();
  });
});

describe('ContactService.findAll — Column Catalogue fields', () => {
  const listAll = async (order?: string) =>
    (
      await contacts.findAll({
        organizationId: org,
        viewer: { userId: lucia, readsAllTasks: true },
        order,
      })
    ).items;

  it('returns Cargo, email, phone, LinkedIn and the created date', async () => {
    await f.contact(org, {
      name: 'Paula',
      role: 'CFO',
      email: 'paula@acme.com',
      phone: '+54 11 5555-0000',
      linkedin: 'linkedin.com/in/paula',
      createdAt: new Date('2026-03-04T12:00:00Z'),
    });

    expect(await listAll()).toEqual([
      expect.objectContaining({
        role: 'CFO',
        email: 'paula@acme.com',
        phone: '+54 11 5555-0000',
        linkedin: 'linkedin.com/in/paula',
        createdAt: '2026-03-04T12:00:00.000Z',
      }),
    ]);
  });

  it('counts only the open Opportunities each Contact is involved in', async () => {
    const stages = await f.stages(org);
    const acme = await f.company(org, { name: 'Acme' });
    const paula = await f.contact(org, { name: 'Paula', companyId: acme });
    await f.contact(org, { name: 'Zoe', companyId: acme });
    const opportunityIn = async (stageId: number) => {
      const id = await f.opportunity(org, {
        companyId: acme,
        ownerId: lucia,
        stageId,
      });
      await f.opportunityContact(id, paula);
    };
    await opportunityIn(stages.open);
    await opportunityIn(stages.proposal);
    await opportunityIn(stages.won);
    await opportunityIn(stages.lost);

    expect(
      (await listAll()).map((c) => [c.name, c.openOpportunityCount]),
    ).toEqual([
      ['Paula', 2],
      ['Zoe', 0],
    ]);
  });

  describe('sorting on the server', () => {
    beforeEach(async () => {
      await f.contact(org, {
        name: 'Ana',
        role: 'CTO',
        email: 'b@acme.com',
        createdAt: new Date('2026-02-01T00:00:00Z'),
      });
      await f.contact(org, {
        name: 'Bruno',
        role: 'CEO',
        email: 'c@acme.com',
        createdAt: new Date('2026-03-01T00:00:00Z'),
      });
      await f.contact(org, {
        name: 'Carla',
        role: 'CFO',
        email: 'a@acme.com',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      });
    });
    const names = async (order: string) =>
      (await listAll(order)).map((c) => c.name);

    it('by Cargo', async () => {
      expect(await names('role:asc')).toEqual(['Bruno', 'Carla', 'Ana']);
      expect(await names('role:desc')).toEqual(['Ana', 'Carla', 'Bruno']);
    });

    it('by email', async () => {
      expect(await names('email:asc')).toEqual(['Carla', 'Ana', 'Bruno']);
      expect(await names('email:desc')).toEqual(['Bruno', 'Ana', 'Carla']);
    });

    it('by created date', async () => {
      expect(await names('createdAt:asc')).toEqual(['Carla', 'Ana', 'Bruno']);
      expect(await names('createdAt:desc')).toEqual(['Bruno', 'Ana', 'Carla']);
    });

    it('not by the open Opportunities count', async () => {
      await expect(listAll('openOpportunityCount:asc')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
