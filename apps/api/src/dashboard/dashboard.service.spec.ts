import { createTestDatabase } from '../common/database/testing/test-database';
import { fixtures } from '../common/database/testing/fixtures';
import { testServices } from '../common/database/testing/test-services';

async function setup() {
  const db = await createTestDatabase();
  const f = fixtures(db);
  const services = await testServices(db);
  return { f, dashboard: services.dashboard };
}

type Fixtures = Awaited<ReturnType<typeof setup>>['f'];

/** An Organization with one Vacancy in an open status and one in a final status. */
async function organizationWithStatuses(
  f: Fixtures,
  names: { open: string; final: string },
) {
  const org = await f.organization();
  const userId = await f.user(org, []);
  const companyId = await f.company(org);
  const open = await f.vacancyStatus(org, names.open);
  const final = await f.vacancyStatus(org, names.final, { isFinal: true });
  await f.vacancy(org, { companyId, createdBy: userId, statusId: open });
  await f.vacancy(org, { companyId, createdBy: userId, statusId: final });
  return org;
}

/** The dashboard of a fresh database holding a single such Organization. */
async function dashboardWithStatuses(names: { open: string; final: string }) {
  const { f, dashboard } = await setup();
  const org = await organizationWithStatuses(f, names);
  return dashboard.getDashboard(org);
}

describe('DashboardService.getDashboard', () => {
  it('counts active Vacancies by the final flag, whatever the statuses are called', async () => {
    const defaults = await dashboardWithStatuses({
      open: 'Abierta',
      final: 'Cubierta',
    });
    const renamed = await dashboardWithStatuses({
      open: 'En curso',
      final: 'Terminada',
    });

    expect(renamed.activeVacancies).toEqual(defaults.activeVacancies);
  });

  it("counts only the Organization's own Candidates and Vacancies", async () => {
    const { f, dashboard } = await setup();
    const mine = await organizationWithStatuses(f, {
      open: 'Abierta',
      final: 'Cubierta',
    });
    await f.candidate(mine);
    const other = await organizationWithStatuses(f, {
      open: 'Abierta',
      final: 'Cubierta',
    });
    await f.candidate(other);
    await f.candidate(other);

    const result = await dashboard.getDashboard(mine);

    expect(result).toMatchObject({
      activeCandidates: 1,
      activeVacancies: 1,
      monthlyCandidates: 1,
      monthlyVacancies: 2,
    });
  });
});

describe('DashboardService.countMyActiveVacancies', () => {
  it('counts the open Vacancies the User owns, by the final flag', async () => {
    const { f, dashboard } = await setup();
    const org = await f.organization();
    const ana = await f.user(org, [], 'Ana');
    const beto = await f.user(org, [], 'Beto');
    const companyId = await f.company(org);
    const open = await f.vacancyStatus(org, 'En curso');
    const final = await f.vacancyStatus(org, 'Terminada', { isFinal: true });
    const vacancy = (assignedTo: number, statusId: number | null) =>
      f.vacancy(org, { companyId, createdBy: beto, assignedTo, statusId });
    await vacancy(ana, open);
    await vacancy(ana, open);
    await vacancy(ana, final);
    await vacancy(ana, null);
    await vacancy(beto, open);

    expect(await dashboard.countMyActiveVacancies(org, ana)).toEqual({
      count: 2,
    });
  });
});

describe('DashboardService.countCandidatesAddedLast30Days', () => {
  it("counts the Organization's Candidates created in the last 30 days", async () => {
    const { f, dashboard } = await setup();
    const now = new Date('2026-05-31T12:00:00');
    const org = await f.organization();
    const other = await f.organization();
    const added = (organizationId: number, createdAt: string) =>
      f.candidate(organizationId, undefined, {
        createdAt: new Date(createdAt),
      });
    await added(org, '2026-05-30T09:00:00');
    await added(org, '2026-05-02T12:00:00');
    await added(org, '2026-05-01T11:00:00');
    await added(other, '2026-05-30T09:00:00');

    expect(await dashboard.countCandidatesAddedLast30Days(org, now)).toEqual({
      count: 2,
    });
  });
});

describe('DashboardService.getRecruiterStats', () => {
  it('counts every non-final Vacancy as active, whatever its status is called', async () => {
    const { f, dashboard } = await setup();
    const org = await f.organization();
    const recruiter = await f.user(org, [], 'Ana');
    const companyId = await f.company(org);
    for (const name of ['En curso', 'Pausada']) {
      const statusId = await f.vacancyStatus(org, name);
      await f.vacancy(org, { companyId, createdBy: recruiter, statusId });
    }
    const final = await f.vacancyStatus(org, 'Terminada', { isFinal: true });
    await f.vacancy(org, { companyId, createdBy: recruiter, statusId: final });

    const [row] = await dashboard.getRecruiterStats(org);

    expect(row.activeVacancies).toBe(2);
  });

  it('rates filled against filled plus cancelled among final Vacancies', async () => {
    const { f, dashboard } = await setup();
    const org = await f.organization();
    const recruiter = await f.user(org, [], 'Ana');
    const companyId = await f.company(org);
    for (const name of ['Cubierta', 'Cubierta', 'Cancelada']) {
      const statusId = await f.vacancyStatus(org, name, { isFinal: true });
      await f.vacancy(org, { companyId, createdBy: recruiter, statusId });
    }

    const [row] = await dashboard.getRecruiterStats(org);

    expect(row.fillRate).toBe(67);
  });

  it("lists only the Organization's own recruiters", async () => {
    const { f, dashboard } = await setup();
    const mine = await organizationWithStatuses(f, {
      open: 'Abierta',
      final: 'Cubierta',
    });
    await organizationWithStatuses(f, { open: 'Abierta', final: 'Cubierta' });

    const rows = await dashboard.getRecruiterStats(mine);

    expect(rows).toHaveLength(1);
  });
});
