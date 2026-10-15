import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { InteractionType, PermissionCode } from '@workspace/shared/enums';
import type { CreateInteractionDto } from '@workspace/shared/dtos';
import { fixtures } from '../database/testing/fixtures';
import { createTestDatabase } from '../database/testing/test-database';
import { testServices } from '../database/testing/test-services';

/**
 * Deleting an Opportunity, a Contact or a Company never takes history with
 * it (PRD "Deletion"). Each effect is observed through the read methods of
 * the service that owns the surviving record.
 */
let s: Awaited<ReturnType<typeof testServices>>;
let f: ReturnType<typeof fixtures>;
let org: number;
let partner: number;
let acme: number;
let stages: Awaited<ReturnType<ReturnType<typeof fixtures>['stages']>>;

beforeEach(async () => {
  const db = await createTestDatabase();
  s = await testServices(db);
  f = fixtures(db);
  org = await f.organization();
  partner = await f.user(org, [PermissionCode.CRM_MANAGE]);
  stages = await f.stages(org);
  acme = await f.company(org, { name: 'Acme' });
});

const actor = () => ({
  organizationId: org,
  userId: partner,
  codes: [PermissionCode.CRM_MANAGE],
});

const newTask = (title: string, ids: Record<string, number[]>) =>
  s.tasks.create({
    title,
    assignedTo: partner,
    createdBy: partner,
    organizationId: org,
    ...ids,
  });

const tasksSeenBy = async (commercialAccess: boolean) =>
  (await s.tasks.findAll({ organizationId: org, commercialAccess })).items;

const interaction = (dto: Partial<CreateInteractionDto>) =>
  s.interactions.create(
    {
      type: InteractionType.CALL,
      date: '2026-10-01',
      summary: 'Llamada',
      ...dto,
    },
    { organizationId: org, userId: partner },
  );

const allInteractions = () => s.interactions.findAll({}, org);

const newOpportunity = () =>
  f.opportunity(org, {
    companyId: acme,
    ownerId: partner,
    stageId: stages.open,
    title: 'CFO search',
  });

describe('Deleting an Opportunity', () => {
  let opportunity: number;
  beforeEach(async () => {
    opportunity = await newOpportunity();
  });

  it('keeps its Tasks, still commercial', async () => {
    await newTask('Enviar propuesta', { opportunityIds: [opportunity] });
    await s.opportunities.remove(opportunity, org);

    expect({
      recruiter: await tasksSeenBy(false),
      commercial: await tasksSeenBy(true),
    }).toEqual({
      recruiter: [],
      commercial: [
        expect.objectContaining({
          title: 'Enviar propuesta',
          opportunities: [],
        }),
      ],
    });
  });

  it('keeps its Interactions on the Company, without the Opportunity link', async () => {
    await interaction({ opportunityId: opportunity });
    await s.opportunities.remove(opportunity, org);

    expect(await s.interactions.findAll({ companyId: acme }, org)).toEqual([
      expect.objectContaining({ companyId: acme, opportunityId: null }),
    ]);
  });

  it('keeps its Vacancies, unlinked', async () => {
    const vacancy = await f.vacancy(org, {
      companyId: acme,
      createdBy: partner,
      opportunityId: opportunity,
    });
    await s.opportunities.remove(opportunity, org);

    expect((await s.vacancies.findOne(vacancy, org)).opportunityId).toBeNull();
  });
});

describe('Deleting a Contact', () => {
  let paula: number;
  beforeEach(async () => {
    paula = await f.contact(org, { name: 'Paula', companyId: acme });
  });

  it('keeps their Tasks, still commercial', async () => {
    await newTask('Abordar a Paula', { contactIds: [paula] });
    await s.contacts.remove(paula, actor());

    expect({
      recruiter: await tasksSeenBy(false),
      commercial: await tasksSeenBy(true),
    }).toEqual({
      recruiter: [],
      commercial: [
        expect.objectContaining({ title: 'Abordar a Paula', contacts: [] }),
      ],
    });
  });

  it('clears any Vacancy Contact pointing at them', async () => {
    const vacancy = await f.vacancy(org, {
      companyId: acme,
      createdBy: partner,
      vacancyContactId: paula,
    });
    await s.contacts.remove(paula, actor());

    expect((await s.vacancies.findOne(vacancy, org)).vacancyContact).toBeNull();
  });

  it('keeps the Opportunities they were on', async () => {
    const opportunity = await s.opportunities.createFromContact(
      paula,
      { title: 'CFO search' },
      { organizationId: org, createdBy: partner },
    );
    await s.contacts.remove(paula, actor());

    expect(
      (await s.opportunities.findAll({ organizationId: org })).map(
        (o) => o.id,
      ),
    ).toEqual([opportunity.id]);
  });

  it('deletes only the Interactions left with neither Contacts nor a Company', async () => {
    const juan = await f.contact(org, { name: 'Juan' });
    const loner = await f.contact(org, { name: 'Sin empresa' });
    const onlyHer = await interaction({ contactIds: [paula], companyId: null });
    const withJuan = await interaction({
      contactIds: [paula, juan],
      companyId: null,
    });
    const onCompany = await interaction({ contactIds: [paula] });
    await interaction({ contactIds: [loner] });

    await s.contacts.remove(paula, actor());

    const kept = (await allInteractions()).map((i) => i.id);
    expect({
      onlyHer: kept.includes(onlyHer.id),
      withJuan: kept.includes(withJuan.id),
      onCompany: kept.includes(onCompany.id),
    }).toEqual({ onlyHer: false, withJuan: true, onCompany: true });
  });

  it('leaves the Interactions they were on, without them', async () => {
    const juan = await f.contact(org, { name: 'Juan', companyId: acme });
    const call = await interaction({ contactIds: [paula, juan] });
    await s.contacts.remove(paula, actor());

    expect(
      (await s.interactions.findOne(call.id, org)).contacts.map(
        (c) => c.name,
      ),
    ).toEqual(['Juan']);
  });
});

describe('Deleting a Company', () => {
  it('keeps its Contacts, without a Company', async () => {
    const paula = await f.contact(org, { name: 'Paula', companyId: acme });
    await s.companies.remove(acme, org);

    expect((await s.contacts.findOne(paula, org)).company).toBeNull();
  });

  it('deletes its Opportunities', async () => {
    await newOpportunity();
    await s.companies.remove(acme, org);

    expect(await s.opportunities.findAll({ organizationId: org })).toEqual([]);
  });

  it('deletes its Vacancies', async () => {
    const vacancy = await f.vacancy(org, { companyId: acme, createdBy: partner });
    await s.companies.remove(acme, org);

    await expect(s.vacancies.findOne(vacancy, org)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('keeps Interactions with a Contact, without the Company, and deletes the Company-only ones', async () => {
    const paula = await f.contact(org, { name: 'Paula', companyId: acme });
    await interaction({ companyId: acme, summary: 'Solo empresa' });
    await interaction({ contactIds: [paula], summary: 'Con Paula' });

    await s.companies.remove(acme, org);

    expect(await allInteractions()).toEqual([
      expect.objectContaining({ summary: 'Con Paula', companyId: null }),
    ]);
  });

  it("keeps its Opportunities' Tasks, still commercial", async () => {
    const opportunity = await newOpportunity();
    await newTask('Enviar propuesta', { opportunityIds: [opportunity] });
    await s.companies.remove(acme, org);

    expect({
      recruiter: await tasksSeenBy(false),
      commercial: (await tasksSeenBy(true)).map((t) => t.title),
    }).toEqual({ recruiter: [], commercial: ['Enviar propuesta'] });
  });
});
