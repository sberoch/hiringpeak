import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { PermissionCode } from '@workspace/shared/enums';
import type { CompanyService } from '../company/company.service';
import type { ContactService } from '../contact/contact.service';
import { fixtures } from '../common/database/testing/fixtures';
import {
  createTestDatabase,
  failInsertsInto,
} from '../common/database/testing/test-database';
import { testServices } from '../common/database/testing/test-services';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import type { OpportunityService } from './opportunity.service';

let db: DrizzleDatabase;
let opportunities: OpportunityService;
let contacts: ContactService;
let companies: CompanyService;
let f: ReturnType<typeof fixtures>;
let org: number;
let creator: number;
let accountOwner: number;
let acme: number;
let initech: number;
let actor: { organizationId: number; createdBy: number };

beforeEach(async () => {
  db = await createTestDatabase();
  ({ opportunities, contacts, companies } = await testServices(db));
  f = fixtures(db);
  org = await f.organization();
  creator = await f.user(org, [PermissionCode.CRM_MANAGE]);
  accountOwner = await f.user(org, [PermissionCode.CRM_READ]);
  await f.stages(org);
  acme = await f.company(org, { name: 'Acme' });
  initech = await f.company(org, { name: 'Initech' });
  actor = { organizationId: org, createdBy: creator };
});

const companyNames = async () =>
  (await companies.findAll({ organizationId: org })).items
    .map((c) => c.name)
    .sort();

describe('OpportunityService.create — Default owners', () => {
  it("is owned by the Company's Account Owner by default", async () => {
    const withOwner = await f.company(org, { accountOwnerId: accountOwner });
    const created = await opportunities.create({
      title: 'CFO search',
      companyId: withOwner,
      ...actor,
    });
    expect(created.ownerId).toBe(accountOwner);
  });

  it('is owned by the creator when the Company has no Account Owner', async () => {
    const created = await opportunities.create({
      title: 'CFO search',
      companyId: acme,
      ...actor,
    });
    expect(created.ownerId).toBe(creator);
  });

  it('keeps an explicitly chosen owner', async () => {
    const withOwner = await f.company(org, { accountOwnerId: accountOwner });
    const created = await opportunities.create({
      title: 'CFO search',
      companyId: withOwner,
      ownerId: creator,
      ...actor,
    });
    expect(created.ownerId).toBe(creator);
  });
});

describe('OpportunityService.createFromContact', () => {
  describe('from a Contact with a Company', () => {
    let paula: number;
    beforeEach(async () => {
      paula = await f.contact(org, { name: 'Paula', companyId: acme });
    });

    it("creates the Opportunity at the Contact's Company", async () => {
      const created = await opportunities.createFromContact(
        paula,
        { title: 'CFO search' },
        actor,
      );
      expect(await opportunities.findOne(created.id, org)).toMatchObject({
        title: 'CFO search',
        company: { id: acme, name: 'Acme' },
      });
    });

    it('adds the Contact to the new Opportunity', async () => {
      const created = await opportunities.createFromContact(
        paula,
        { title: 'CFO search' },
        actor,
      );
      const ofPaula = await opportunities.findAll({
        organizationId: org,
        contactId: paula,
      });
      expect(ofPaula.map((o) => o.id)).toEqual([created.id]);
    });

    it("is owned by the Company's Account Owner by default", async () => {
      const globex = await f.company(org, { accountOwnerId: accountOwner });
      const ana = await f.contact(org, { companyId: globex });
      const created = await opportunities.createFromContact(
        ana,
        { title: 'CFO search' },
        actor,
      );
      expect(created.ownerId).toBe(accountOwner);
    });

    it('rejects another Company', async () => {
      await expect(
        opportunities.createFromContact(
          paula,
          { title: 'CFO', companyId: initech },
          actor,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('from a Contact without a Company', () => {
    let paula: number;
    beforeEach(async () => {
      paula = await f.contact(org, { name: 'Paula' });
    });

    it('makes the chosen Company theirs and creates the Opportunity there', async () => {
      const created = await opportunities.createFromContact(
        paula,
        { title: 'CFO search', companyId: initech },
        actor,
      );
      expect({
        contactCompany: (await contacts.findOne(paula, org)).companyId,
        opportunityCompany: created.companyId,
      }).toEqual({ contactCompany: initech, opportunityCompany: initech });
    });

    it('makes a new Company theirs and creates the Opportunity there', async () => {
      const created = await opportunities.createFromContact(
        paula,
        { title: 'CFO search', newCompanyName: 'Globex' },
        actor,
      );
      expect({
        contactCompany: (await contacts.findOne(paula, org)).company?.name,
        opportunityCompany: created.company.name,
      }).toEqual({ contactCompany: 'Globex', opportunityCompany: 'Globex' });
    });

    it('leaves the Contact and Companies untouched when the Opportunity cannot be saved', async () => {
      // Fault injection at the database: adding any Opportunity Contact fails.
      await failInsertsInto('opportunity_contacts');

      await expect(
        opportunities.createFromContact(
          paula,
          { title: 'CFO search', newCompanyName: 'Globex' },
          actor,
        ),
      ).rejects.toThrow();
      expect({
        contactCompany: (await contacts.findOne(paula, org)).companyId,
        companies: await companyNames(),
        opportunities: await opportunities.findAll({ organizationId: org }),
      }).toEqual({
        contactCompany: null,
        companies: ['Acme', 'Initech'],
        opportunities: [],
      });
    });

    it('requires a Company', async () => {
      await expect(
        opportunities.createFromContact(paula, { title: 'CFO search' }, actor),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
