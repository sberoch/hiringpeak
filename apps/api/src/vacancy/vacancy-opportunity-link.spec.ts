import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { PermissionCode } from '@workspace/shared/enums';
import type { OpportunityService } from '../opportunity/opportunity.service';
import { fixtures } from '../common/database/testing/fixtures';
import { createTestDatabase } from '../common/database/testing/test-database';
import { testServices } from '../common/database/testing/test-services';
import type { VacancyService } from './vacancy.service';

/**
 * Linking a Vacancy to an Opportunity is commercial: only CRM_MANAGE may set
 * or clear it through the Vacancy API, and only commercial users see it.
 */
const RECRUITER = [PermissionCode.VACANCY_MANAGE, PermissionCode.VACANCY_READ];
const PARTNER = [PermissionCode.VACANCY_MANAGE, PermissionCode.CRM_MANAGE];

let vacancies: VacancyService;
let opportunities: OpportunityService;
let f: ReturnType<typeof fixtures>;
let org: number;
let user: number;
let acme: number;
let globex: number;
let statusId: number;
let wonDeal: number;

beforeEach(async () => {
  const db = await createTestDatabase();
  ({ vacancies, opportunities } = await testServices(db));
  f = fixtures(db);
  org = await f.organization();
  user = await f.user(org, PARTNER);
  acme = await f.company(org, { name: 'Acme' });
  globex = await f.company(org, { name: 'Globex' });
  statusId = await f.vacancyStatus(org);
  const stages = await f.stages(org);
  wonDeal = await f.opportunity(org, {
    companyId: acme,
    ownerId: user,
    stageId: stages.won,
  });
});

const vacancyDto = (fields: Record<string, unknown> = {}) => ({
  title: 'Gerente Comercial',
  statusId,
  filters: {},
  companyId: acme,
  createdBy: user,
  assignedTo: user,
  organizationId: org,
  ...fields,
});

describe('Setting the Opportunity of a Vacancy', () => {
  it('is forbidden without CRM_MANAGE, whether or not the Opportunity exists', async () => {
    await expect(
      vacancies.create(vacancyDto({ opportunityId: 999_999 }), RECRUITER),
    ).rejects.toThrow(ForbiddenException);
  });

  it('is forbidden without CRM_MANAGE when clearing it', async () => {
    const vacancy = await vacancies.create(
      vacancyDto({ opportunityId: wonDeal }),
      PARTNER,
    );
    await expect(
      vacancies.update(
        vacancy.id,
        { opportunityId: null, organizationId: org },
        RECRUITER,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('links a won Opportunity of the same Company with CRM_MANAGE', async () => {
    const vacancy = await vacancies.create(
      vacancyDto({ opportunityId: wonDeal }),
      PARTNER,
    );
    expect(
      (await vacancies.findOne(vacancy.id, org, PARTNER)).opportunityId,
    ).toBe(wonDeal);
  });

  it('lets recruiters edit a linked Vacancy without touching the link', async () => {
    const vacancy = await vacancies.create(
      vacancyDto({ opportunityId: wonDeal }),
      PARTNER,
    );
    await vacancies.update(
      vacancy.id,
      { title: 'Gerente de Ventas', organizationId: org },
      RECRUITER,
    );
    expect(
      (await vacancies.findOne(vacancy.id, org, PARTNER)).opportunityId,
    ).toBe(wonDeal);
  });
});

describe('Reading the Opportunity of a Vacancy', () => {
  let vacancyId: number;
  beforeEach(async () => {
    vacancyId = (
      await vacancies.create(vacancyDto({ opportunityId: wonDeal }), PARTNER)
    ).id;
  });

  it('is hidden from a Vacancy for callers without commercial access', async () => {
    expect(
      await vacancies.findOne(vacancyId, org, RECRUITER),
    ).not.toHaveProperty('opportunityId');
  });

  it('is hidden from the Vacancy list for callers without commercial access', async () => {
    const page = await vacancies.findAll({ organizationId: org }, RECRUITER);
    expect(page.items[0]).not.toHaveProperty('opportunityId');
  });

  it('is hidden from what a write returns to callers without commercial access', async () => {
    const updated = await vacancies.update(
      vacancyId,
      { title: 'Otra', organizationId: org },
      RECRUITER,
    );
    expect(updated).not.toHaveProperty('opportunityId');
  });

  it('is shown to commercial readers', async () => {
    const page = await vacancies.findAll({ organizationId: org }, [
      PermissionCode.CRM_READ,
    ]);
    expect(page.items[0]).toMatchObject({ opportunityId: wonDeal });
  });
});

describe('Company changes and the link', () => {
  it("moving the Vacancy to another Company unlinks it from the first Company's Opportunity", async () => {
    const vacancy = await vacancies.create(
      vacancyDto({ opportunityId: wonDeal }),
      PARTNER,
    );
    await vacancies.update(
      vacancy.id,
      { companyId: globex, organizationId: org },
      RECRUITER,
    );
    expect(
      (await vacancies.findOne(vacancy.id, org, PARTNER)).opportunityId,
    ).toBeNull();
  });

  it('moving the Opportunity to another Company leaves its Vacancies linked', async () => {
    const vacancy = await vacancies.create(
      vacancyDto({ opportunityId: wonDeal }),
      PARTNER,
    );
    await opportunities.update(wonDeal, {
      companyId: globex,
      organizationId: org,
    });
    expect(
      (await vacancies.findOne(vacancy.id, org, PARTNER)).opportunityId,
    ).toBe(wonDeal);
  });
});
