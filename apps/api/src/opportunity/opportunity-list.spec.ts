import type { OpportunitySortField } from '@workspace/shared/dtos';
import type { SortDirection } from '@workspace/shared/lib/sort-order';
import { beforeEach, describe, expect, it } from 'vitest';
import { PermissionCode } from '@workspace/shared/enums';
import { fixtures } from '../common/database/testing/fixtures';
import { createTestDatabase } from '../common/database/testing/test-database';
import { testServices } from '../common/database/testing/test-services';
import type { OpportunityService } from './opportunity.service';

let opportunities: OpportunityService;
let f: ReturnType<typeof fixtures>;
let org: number;
let owner: number;
let acme: number;
let stages: Awaited<ReturnType<ReturnType<typeof fixtures>['stages']>>;

beforeEach(async () => {
  const db = await createTestDatabase();
  ({ opportunities } = await testServices(db));
  f = fixtures(db);
  org = await f.organization();
  owner = await f.user(org, [PermissionCode.CRM_MANAGE]);
  stages = await f.stages(org);
  acme = await f.company(org, { name: 'Acme' });
});

const opportunity = (fields: Partial<Parameters<typeof f.opportunity>[1]>) =>
  f.opportunity(org, {
    companyId: acme,
    ownerId: owner,
    stageId: stages.open,
    ...fields,
  });

const listed = async (id: number) =>
  (await opportunities.findAll({ organizationId: org })).find(
    (o) => o.id === id,
  )!;

describe('OpportunityService.findAll — catalogue fields', () => {
  it('lists the Contacts that are part of each Opportunity, by name', async () => {
    const search = await opportunity({ title: 'CFO search' });
    await f.opportunityContact(
      search,
      await f.contact(org, { name: 'Paula', companyId: acme }),
    );
    await f.opportunityContact(
      search,
      await f.contact(org, { name: 'Ana', companyId: acme }),
    );

    expect((await listed(search)).contacts.map((c) => c.name)).toEqual([
      'Ana',
      'Paula',
    ]);
  });

  it('counts the Vacancies linked to each Opportunity', async () => {
    const won = await opportunity({ stageId: stages.won });
    await opportunity({});
    await f.vacancy(org, {
      companyId: acme,
      createdBy: owner,
      opportunityId: won,
    });
    await f.vacancy(org, {
      companyId: acme,
      createdBy: owner,
      opportunityId: won,
    });
    await f.vacancy(org, { companyId: acme, createdBy: owner });

    expect((await listed(won)).vacancyCount).toBe(2);
  });

  it('shows the Close Date and Lost Reason of a lost Opportunity', async () => {
    const budget = await f.lostReason(org, 'Sin presupuesto');
    const lost = await opportunity({
      stageId: stages.lost,
      closeDate: '2026-09-30',
      lostReasonId: budget,
    });

    const { closeDate, lostReason } = await listed(lost);
    expect({ closeDate, lostReason: lostReason?.name }).toEqual({
      closeDate: '2026-09-30',
      lostReason: 'Sin presupuesto',
    });
  });
});

describe('OpportunityService.findAll — sorting', () => {
  const titles = async (
    field: OpportunitySortField,
    direction: SortDirection,
  ) =>
    (
      await opportunities.findAll({
        organizationId: org,
        order: { field, direction },
      })
    ).map((o) => o.title);

  it('sorts by Close Date, Opportunities without one last', async () => {
    await opportunity({ title: 'Open' });
    await opportunity({
      title: 'October',
      stageId: stages.won,
      closeDate: '2026-10-01',
    });
    await opportunity({
      title: 'August',
      stageId: stages.won,
      closeDate: '2026-08-01',
    });

    expect({
      asc: await titles('closeDate', 'asc'),
      desc: await titles('closeDate', 'desc'),
    }).toEqual({
      asc: ['August', 'October', 'Open'],
      desc: ['October', 'August', 'Open'],
    });
  });

  it('sorts by created date', async () => {
    await opportunity({ title: 'March', createdAt: new Date('2026-03-01') });
    await opportunity({ title: 'January', createdAt: new Date('2026-01-01') });
    await opportunity({ title: 'May', createdAt: new Date('2026-05-01') });

    expect(await titles('createdAt', 'asc')).toEqual([
      'January',
      'March',
      'May',
    ]);
  });
});
