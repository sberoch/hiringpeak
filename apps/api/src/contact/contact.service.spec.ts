import { BadRequestException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PermissionCode } from '@workspace/shared/enums';
import { fixtures } from '../common/database/testing/fixtures';
import { createTestDatabase } from '../common/database/testing/test-database';
import { testServices } from '../common/database/testing/test-services';
import type { TaskService } from '../task/task.service';
import type { ContactActor } from './contact.dto';
import type { ContactService } from './contact.service';

let contacts: ContactService;
let tasks: TaskService;
let f: ReturnType<typeof fixtures>;
let org: number;
let lucia: number;
let tomas: number;
let partner: ContactActor;

beforeEach(async () => {
  const db = await createTestDatabase();
  ({ contacts, tasks } = await testServices(db));
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
