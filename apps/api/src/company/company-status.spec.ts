import { describe, expect, it } from 'vitest';
import { CompanyStatus } from '@workspace/shared/enums';
import { fixtures } from '../common/database/testing/fixtures';
import { createTestDatabase } from '../common/database/testing/test-database';
import { testServices } from '../common/database/testing/test-services';
import { deriveCompanyStatus } from './company-status';

const open = { isWon: false };
const won = { isWon: true };
const lost = { isWon: false };

describe('deriveCompanyStatus', () => {
  it('a won Opportunity makes the Company a Client', () => {
    expect(
      deriveCompanyStatus({ opportunities: [open, won], vacancyCount: 0 }),
    ).toBe(CompanyStatus.CLIENT);
  });

  it('a pre-CRM Vacancy alone makes the Company a Client', () => {
    expect(deriveCompanyStatus({ opportunities: [], vacancyCount: 1 })).toBe(
      CompanyStatus.CLIENT,
    );
  });

  it('open or lost Opportunities alone keep the Company a Prospect', () => {
    expect(
      deriveCompanyStatus({ opportunities: [open, lost], vacancyCount: 0 }),
    ).toBe(CompanyStatus.PROSPECT);
  });

  it('a Company with nothing is a Prospect', () => {
    expect(deriveCompanyStatus({ opportunities: [], vacancyCount: 0 })).toBe(
      CompanyStatus.PROSPECT,
    );
  });
});

describe('Filtering Companies by status', () => {
  it('agrees with the status each Company shows', async () => {
    const db = await createTestDatabase();
    const { companies } = await testServices(db);
    const f = fixtures(db);
    const org = await f.organization();
    const user = await f.user(org, []);
    const stages = await f.stages(org);
    const withVacancy = await f.company(org, { name: 'Con vacante' });
    await f.vacancy(org, { companyId: withVacancy, createdBy: user });
    const withWon = await f.company(org, { name: 'Ganada' });
    await f.opportunity(org, {
      companyId: withWon,
      ownerId: user,
      stageId: stages.won,
    });
    const withOpen = await f.company(org, { name: 'Abierta' });
    await f.opportunity(org, {
      companyId: withOpen,
      ownerId: user,
      stageId: stages.open,
    });
    await f.company(org, { name: 'Nada' });

    const names = async (status?: CompanyStatus) =>
      (await companies.findAll({ organizationId: org, status })).items
        .map((c) => `${c.name}:${c.status}`)
        .sort();

    expect({
      clients: await names(CompanyStatus.CLIENT),
      prospects: await names(CompanyStatus.PROSPECT),
    }).toEqual({
      clients: ['Con vacante:Client', 'Ganada:Client'],
      prospects: ['Abierta:Prospect', 'Nada:Prospect'],
    });
  });
});
