import { describe, expect, it } from 'vitest';
import { PermissionCode } from '@workspace/shared/enums';
import { fixtures } from '../common/database/testing/fixtures';
import { createTestDatabase } from '../common/database/testing/test-database';
import { testServices } from '../common/database/testing/test-services';

const COMMERCIAL = [PermissionCode.CRM_READ];

async function setup() {
  const db = await createTestDatabase();
  const { companies } = await testServices(db);
  const f = fixtures(db);
  const org = await f.organization();
  const user = await f.user(org, []);
  return { companies, f, org, user };
}

describe('The Companies list', () => {
  it('counts every Vacancy of a Company, closed ones included', async () => {
    const { companies, f, org, user } = await setup();
    const company = await f.company(org, { name: 'Acme' });
    const open = await f.vacancyStatus(org, 'Abierta');
    const closed = await f.vacancyStatus(org, 'Cerrada', { isFinal: true });
    await f.vacancy(org, { companyId: company, createdBy: user, statusId: open });
    await f.vacancy(org, {
      companyId: company,
      createdBy: user,
      statusId: closed,
    });

    const [acme] = (await companies.findAll({ organizationId: org })).items;

    expect(acme.vacancyCount).toBe(2);
  });

  it('gives the open Estimated Fee to viewers with commercial access', async () => {
    const { companies, f, org, user } = await setup();
    const stages = await f.stages(org);
    const company = await f.company(org);
    for (const [stageId, estimatedFee] of [
      [stages.open, '1000'],
      [stages.proposal, '2500'],
      [stages.won, '9000'],
    ] as const) {
      await f.opportunity(org, {
        companyId: company,
        ownerId: user,
        stageId,
        estimatedFee,
      });
    }

    const [listed] = (
      await companies.findAll({ organizationId: org }, COMMERCIAL)
    ).items;

    expect(listed.commercial?.openOpportunityFee).toBe(3500);
  });

  it('hides the open Estimated Fee from viewers without commercial access', async () => {
    const { companies, f, org, user } = await setup();
    const stages = await f.stages(org);
    const company = await f.company(org);
    await f.opportunity(org, {
      companyId: company,
      ownerId: user,
      stageId: stages.open,
      estimatedFee: '1000',
    });

    const [listed] = (await companies.findAll({ organizationId: org }, []))
      .items;

    expect(listed.commercial).toBeUndefined();
  });

  it('tells when each Company was added', async () => {
    const { companies, f, org } = await setup();
    await f.company(org, { createdAt: new Date('2026-03-04T10:00:00Z') });

    const [listed] = (await companies.findAll({ organizationId: org })).items;

    expect(new Date(listed.createdAt).toISOString()).toBe(
      '2026-03-04T10:00:00.000Z',
    );
  });

  it('sorts Companies by the date they were added', async () => {
    const { companies, f, org } = await setup();
    await f.company(org, {
      name: 'Middle',
      createdAt: new Date('2026-02-01T00:00:00Z'),
    });
    await f.company(org, {
      name: 'Newest',
      createdAt: new Date('2026-03-01T00:00:00Z'),
    });
    await f.company(org, {
      name: 'Oldest',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    });

    const names = async (order: string) =>
      (await companies.findAll({ organizationId: org, order })).items.map(
        (c) => c.name,
      );

    expect({
      asc: await names('createdAt:asc'),
      desc: await names('createdAt:desc'),
    }).toEqual({
      asc: ['Oldest', 'Middle', 'Newest'],
      desc: ['Newest', 'Middle', 'Oldest'],
    });
  });
});
