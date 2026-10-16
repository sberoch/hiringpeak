import { and, eq, sql } from 'drizzle-orm';
import { PermissionCode, UserType } from '@workspace/shared/enums';
import {
  companies,
  contactSources,
  contacts,
  hashPassword,
  interactionContacts,
  interactions,
  lostReasons,
  opportunities,
  opportunityContacts,
  opportunityStages,
  permissions,
  rolePermissions,
  roles,
  tasks,
  users,
  vacancies,
} from '@workspace/shared/schemas';
import { writeTaskAttachments } from '../../../task/task-attachments';
import { SeedTx } from './types';

/**
 * Commercial side (CRM) demo data, layered on the dev seed:
 *   - one login per persona: a second partner (Manager), a read-only
 *     commercial user (custom role = Basic + CRM_READ) and a recruiter (Basic);
 *   - Prospect Companies (no Vacancies) next to the seeded Clients;
 *   - Contacts with and without a Company, one who changed jobs;
 *   - Opportunities in every stage: won (one linked to a Vacancy, one closed
 *     last year), lost with a Lost Reason, open with and without next step;
 *   - Interactions and commercial Tasks (overdue / today / later / undated).
 * Dates are relative to the day the seed runs, so overdue and "this month"
 * always mean something. Skipped when the Organization already has
 * Opportunities.
 */

const PASSWORD = '12345678';

const dayOffset = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const thisYear = new Date().getFullYear();

async function findOrCreateUser(
  tx: SeedTx,
  values: { email: string; name: string; roleId: number; organizationId: number },
) {
  const existing = await tx.query.users.findFirst({
    where: and(eq(users.email, values.email), eq(users.organizationId, values.organizationId)),
    columns: { id: true },
  });
  if (existing) return existing.id;
  const [row] = await tx
    .insert(users)
    .values({
      ...values,
      password: await hashPassword(PASSWORD),
      active: true,
      userType: UserType.END_USER,
    } as typeof users.$inferInsert)
    .returning({ id: users.id });
  console.log(`  User "${values.email}" created (id=${row!.id})`);
  return row!.id;
}

/** Basic + CRM_READ: sees the whole commercial side, changes nothing. */
async function findOrCreateCommercialReadRole(
  tx: SeedTx,
  organizationId: number,
  basicRoleId: number,
) {
  const name = 'Comercial (solo lectura)';
  const existing = await tx.query.roles.findFirst({
    where: and(eq(roles.name, name), eq(roles.organizationId, organizationId)),
    columns: { id: true },
  });
  if (existing) return existing.id;
  const [role] = await tx
    .insert(roles)
    .values({ name, organizationId } as typeof roles.$inferInsert)
    .returning({ id: roles.id });
  await tx.execute(sql`
    INSERT INTO ${rolePermissions} (role_id, permission_id)
    SELECT ${role!.id}::int, permission_id FROM ${rolePermissions} WHERE role_id = ${basicRoleId}::int
    UNION
    SELECT ${role!.id}::int, id FROM ${permissions} WHERE code = ${PermissionCode.CRM_READ}
    ON CONFLICT DO NOTHING`);
  console.log(`  Role "${name}" created (id=${role!.id})`);
  return role!.id;
}

async function idsByName(
  tx: SeedTx,
  table: typeof opportunityStages | typeof lostReasons | typeof contactSources,
  organizationId: number,
) {
  const rows = await tx
    .select({ id: table.id, name: table.name })
    .from(table)
    .where(eq(table.organizationId, organizationId));
  const map = new Map(rows.map((r) => [r.name, r.id]));
  return (name: string) => {
    const id = map.get(name);
    if (id == null) throw new Error(`Commercial seed: "${name}" not found`);
    return id;
  };
}

export async function seedCommercial(
  tx: SeedTx,
  opts: {
    organizationId: number;
    adminUserId: number;
    managerRoleId: number;
    basicRoleId: number;
    companyIds: Map<string, number>;
    vacancyIds: Map<string, number>;
  },
) {
  const { organizationId, adminUserId: admin } = opts;
  console.log('Seeding commercial side...');

  // --- Personas ---
  const partner = await findOrCreateUser(tx, {
    email: 'socia@gmail.com',
    name: 'Carolina Pratt',
    roleId: opts.managerRoleId,
    organizationId,
  });
  const readRoleId = await findOrCreateCommercialReadRole(tx, organizationId, opts.basicRoleId);
  await findOrCreateUser(tx, {
    email: 'lectura@gmail.com',
    name: 'Julián Acosta',
    roleId: readRoleId,
    organizationId,
  });
  await findOrCreateUser(tx, {
    email: 'reclutadora@gmail.com',
    name: 'Sofía Reclutadora',
    roleId: opts.basicRoleId,
    organizationId,
  });

  const [anyOpportunity] = await tx
    .select({ id: opportunities.id })
    .from(opportunities)
    .where(eq(opportunities.organizationId, organizationId))
    .limit(1);
  if (anyOpportunity) {
    console.log('  Opportunities already exist, skipping commercial data');
    return;
  }

  const stage = await idsByName(tx, opportunityStages, organizationId);
  const lostReason = await idsByName(tx, lostReasons, organizationId);
  const source = await idsByName(tx, contactSources, organizationId);

  // --- Companies: Account Owners on the Clients, plus Prospects ---
  const company = new Map(opts.companyIds);
  const setOwner = (name: string, ownerId: number) =>
    tx.update(companies).set({ accountOwnerId: ownerId } as Partial<typeof companies.$inferInsert>).where(eq(companies.id, company.get(name)!));
  await setOwner('Volkswagen Argentina', admin);
  await setOwner('Salentein', partner);
  await setOwner('Hospital Italiano', admin);
  for (const [name, ownerId] of [
    ['Mercado Libre', admin],
    ['Arcor', partner],
    ['Banco Galicia', null],
    ['Globant', partner],
  ] as const) {
    const [row] = await tx
      .insert(companies)
      .values({ name, description: '', organizationId, accountOwnerId: ownerId } as typeof companies.$inferInsert)
      .returning({ id: companies.id });
    company.set(name, row!.id);
  }
  const co = (name: string) => company.get(name)!;

  // --- Contacts ---
  const contactRows: Array<{
    key: string;
    name: string;
    role: string;
    company: string | null;
    email?: string;
    phone?: string;
    linkedin?: string;
    source: string;
    owner: number | null;
    note?: string;
  }> = [
    { key: 'laura', name: 'Laura Méndez', role: 'Gerente de RRHH', company: 'Volkswagen Argentina', email: 'laura.mendez@vw.com.ar', phone: '+54 11 5555-1001', source: 'Cliente actual', owner: admin },
    { key: 'diego', name: 'Diego Ferraro', role: 'CFO', company: 'Volkswagen Argentina', email: 'dferraro@vw.com.ar', source: 'Referido', owner: admin },
    { key: 'paula', name: 'Paula Ríos', role: 'Directora de Personas', company: 'Salentein', email: 'paula.rios@salentein.com', phone: '+54 261 555-2002', source: 'Evento', owner: partner },
    { key: 'martin', name: 'Martín Sosa', role: 'Head of Talent', company: 'Mercado Libre', email: 'martin.sosa@mercadolibre.com', linkedin: 'https://www.linkedin.com/in/martinsosa', source: 'LinkedIn', owner: admin },
    { key: 'ana', name: 'Ana Gutiérrez', role: 'Gerente General', company: 'Arcor', email: 'agutierrez@arcor.com', source: 'Evento', owner: partner, note: 'La conocimos en el evento de AmCham. Interesada en búsquedas de mandos medios.' },
    { key: 'roberto', name: 'Roberto Díaz', role: 'COO', company: 'Banco Galicia', email: 'roberto.diaz@galicia.com.ar', source: 'Referido', owner: null },
    // Changed jobs: past Interactions stay stamped at Corven.
    { key: 'valeria', name: 'Valeria Luna', role: 'Directora de RRHH', company: 'Globant', email: 'valeria.luna@globant.com', source: 'Cliente actual', owner: partner, note: 'Antes en Corven; se pasó a Globant este año.' },
    { key: 'tomas', name: 'Tomás Herrera', role: 'Founder', company: null, email: 'tomas@startup.io', linkedin: 'https://www.linkedin.com/in/tomasherrera', source: 'Evento', owner: admin, note: 'Founder de una startup fintech, todavía sin empresa cargada.' },
    { key: 'carla', name: 'Carla Vidal', role: 'Consultora independiente', company: null, phone: '+54 9 11 5555-3003', source: 'Referido', owner: partner },
    { key: 'gustavo', name: 'Gustavo Peralta', role: 'Gerente de Planta', company: 'Corven', email: 'gperalta@corven.com.ar', source: 'Cliente actual', owner: null },
  ];
  const contact = new Map<string, number>();
  for (const c of contactRows) {
    const [row] = await tx
      .insert(contacts)
      .values({
        organizationId,
        companyId: c.company ? co(c.company) : null,
        name: c.name,
        role: c.role,
        email: c.email ?? null,
        phone: c.phone ?? null,
        linkedin: c.linkedin ?? null,
        sourceId: source(c.source),
        ownerId: c.owner,
        shortDescription: c.note ?? null,
        createdBy: admin,
      } as typeof contacts.$inferInsert)
      .returning({ id: contacts.id });
    contact.set(c.key, row!.id);
  }
  const ct = (key: string) => contact.get(key)!;

  // --- Opportunities ---
  const oppRows: Array<{
    key: string;
    title: string;
    company: string;
    stage: string;
    owner: number;
    fee: number | null;
    contacts: string[];
    createdDaysAgo: number;
    closeDate?: string;
    lostReason?: string;
  }> = [
    { key: 'vwCfo', title: 'Búsqueda CFO', company: 'Volkswagen Argentina', stage: 'Negociación', owner: admin, fee: 18_500_000, contacts: ['diego', 'laura'], createdDaysAgo: 40 },
    { key: 'meliTech', title: 'Líderes de ingeniería (3 posiciones)', company: 'Mercado Libre', stage: 'Propuesta enviada', owner: admin, fee: 32_000_000, contacts: ['martin'], createdDaysAgo: 20 },
    { key: 'arcorMandos', title: 'Mandos medios planta Arroyito', company: 'Arcor', stage: 'Reunión', owner: partner, fee: 12_000_000, contacts: ['ana'], createdDaysAgo: 5 },
    { key: 'galicia', title: 'Gerente de Operaciones', company: 'Banco Galicia', stage: 'Primer contacto', owner: admin, fee: null, contacts: ['roberto'], createdDaysAgo: 3 },
    { key: 'globant', title: 'HRBP regional', company: 'Globant', stage: 'Primer contacto', owner: partner, fee: 6_500_000, contacts: ['valeria'], createdDaysAgo: 60 },
    { key: 'salenteinWon', title: 'Gerente Comercial', company: 'Salentein', stage: 'Ganada', owner: partner, fee: 9_800_000, contacts: ['paula'], createdDaysAgo: 120, closeDate: `${thisYear}-07-14` },
    { key: 'vwWonOld', title: 'Director de Finanzas', company: 'Volkswagen Argentina', stage: 'Ganada', owner: admin, fee: 15_000_000, contacts: ['laura'], createdDaysAgo: 330, closeDate: `${thisYear - 1}-12-18` },
    { key: 'italianoWon', title: 'Jefe de Sistemas', company: 'Hospital Italiano', stage: 'Ganada', owner: admin, fee: null, contacts: [], createdDaysAgo: 200, closeDate: `${thisYear}-03-02` },
    { key: 'corvenLost', title: 'Gerente de Planta', company: 'Corven', stage: 'Perdida', owner: partner, fee: 8_000_000, contacts: ['gustavo'], createdDaysAgo: 150, closeDate: `${thisYear}-05-20`, lostReason: 'Eligió otra consultora' },
    { key: 'arcorLost', title: 'Director de Marketing', company: 'Arcor', stage: 'Perdida', owner: partner, fee: 11_000_000, contacts: ['ana'], createdDaysAgo: 90, closeDate: `${thisYear}-08-30`, lostReason: 'Precio' },
  ];
  const opp = new Map<string, number>();
  for (const o of oppRows) {
    const createdAt = daysAgo(o.createdDaysAgo);
    const [row] = await tx
      .insert(opportunities)
      .values({
        organizationId,
        title: o.title,
        companyId: co(o.company),
        stageId: stage(o.stage),
        ownerId: o.owner,
        estimatedFee: o.fee == null ? null : String(o.fee),
        closeDate: o.closeDate ?? null,
        lostReasonId: o.lostReason ? lostReason(o.lostReason) : null,
        createdBy: o.owner,
        createdAt,
        updatedAt: createdAt,
      } as typeof opportunities.$inferInsert)
      .returning({ id: opportunities.id });
    opp.set(o.key, row!.id);
    if (o.contacts.length) {
      await tx
        .insert(opportunityContacts)
        .values(o.contacts.map((k) => ({ opportunityId: row!.id, contactId: ct(k) })));
    }
  }
  const op = (key: string) => opp.get(key)!;

  // A won Opportunity produced the seeded "Gerente Comercial" Vacancy.
  const vacancyId = opts.vacancyIds.get('Gerente Comercial');
  if (vacancyId) {
    await tx
      .update(vacancies)
      .set({ opportunityId: op('salenteinWon'), vacancyContactId: ct('paula') } as Partial<typeof vacancies.$inferInsert>)
      .where(eq(vacancies.id, vacancyId));
  }

  // --- Interactions (Company = Company at the time) ---
  const interactionRows: Array<{
    type: 'call' | 'meeting' | 'email' | 'lunch' | 'other';
    daysAgo: number;
    summary: string;
    company: string | null;
    opportunity?: string;
    contacts: string[];
    by: number;
  }> = [
    { type: 'meeting', daysAgo: 35, summary: 'Reunión inicial con Diego: necesitan reemplazar al CFO antes de fin de año.', company: 'Volkswagen Argentina', opportunity: 'vwCfo', contacts: ['diego'], by: admin },
    { type: 'call', daysAgo: 6, summary: 'Llamada de negociación: piden bajar el fee un 10%.', company: 'Volkswagen Argentina', opportunity: 'vwCfo', contacts: ['diego', 'laura'], by: admin },
    { type: 'email', daysAgo: 12, summary: 'Enviamos la propuesta para las 3 posiciones de ingeniería.', company: 'Mercado Libre', opportunity: 'meliTech', contacts: ['martin'], by: admin },
    { type: 'lunch', daysAgo: 4, summary: 'Almuerzo con Ana: quiere avanzar con mandos medios en Arroyito.', company: 'Arcor', opportunity: 'arcorMandos', contacts: ['ana'], by: partner },
    { type: 'meeting', daysAgo: 100, summary: 'Kickoff de la búsqueda de Gerente Comercial.', company: 'Salentein', opportunity: 'salenteinWon', contacts: ['paula'], by: partner },
    { type: 'call', daysAgo: 160, summary: 'Valeria nos pidió ayuda con una búsqueda en Corven.', company: 'Corven', contacts: ['valeria'], by: partner },
    { type: 'other', daysAgo: 25, summary: 'Nos conocimos en el meetup de fintech; quiere armar equipo.', company: null, contacts: ['tomas'], by: admin },
    { type: 'call', daysAgo: 80, summary: 'Llamada de mantenimiento con el hospital (sin oportunidad abierta).', company: 'Hospital Italiano', contacts: [], by: admin },
  ];
  for (const i of interactionRows) {
    const [row] = await tx
      .insert(interactions)
      .values({
        organizationId,
        type: i.type,
        date: dayOffset(-i.daysAgo),
        summary: i.summary,
        companyId: i.company ? co(i.company) : null,
        opportunityId: i.opportunity ? op(i.opportunity) : null,
        createdBy: i.by,
      } as typeof interactions.$inferInsert)
      .returning({ id: interactions.id });
    if (i.contacts.length) {
      await tx
        .insert(interactionContacts)
        .values(i.contacts.map((k) => ({ interactionId: row!.id, contactId: ct(k) })));
    }
  }

  // --- Commercial Tasks: next steps and follow-ups ---
  // "globant" and "galicia" are left without a next step on purpose.
  const taskRows: Array<{
    title: string;
    due: number | null;
    owner: number;
    opportunity?: string;
    contact?: string;
    company?: string;
    completed?: boolean;
  }> = [
    { title: 'Enviar contrapropuesta de fee', due: -2, owner: admin, opportunity: 'vwCfo' },
    { title: 'Seguimiento de la propuesta', due: 0, owner: admin, opportunity: 'meliTech' },
    { title: 'Preparar perfil de puestos con Ana', due: 5, owner: partner, opportunity: 'arcorMandos' },
    { title: 'Agendar reunión de presentación', due: null, owner: admin, opportunity: 'meliTech' },
    { title: 'Llamar a Tomás por su equipo', due: -1, owner: admin, contact: 'tomas' },
    { title: 'Escribirle a Martín por LinkedIn', due: 3, owner: admin, contact: 'martin' },
    { title: 'Café con Carla', due: 10, owner: partner, contact: 'carla' },
    { title: 'Felicitar a Valeria por el nuevo puesto', due: 1, owner: partner, contact: 'valeria' },
    { title: 'Enviar factura de la búsqueda', due: -20, owner: partner, opportunity: 'salenteinWon', completed: true },
    { title: 'Revisión anual de la cuenta', due: 14, owner: admin, company: 'Hospital Italiano' },
  ];
  for (const t of taskRows) {
    const [row] = await tx
      .insert(tasks)
      .values({
        organizationId,
        title: t.title,
        dueDate: t.due == null ? null : dayOffset(t.due),
        completed: t.completed ?? false,
        completedAt: t.completed ? daysAgo(15) : null,
        completedBy: t.completed ? t.owner : null,
        createdBy: t.owner,
        assignedTo: t.owner,
      } as typeof tasks.$inferInsert)
      .returning({ id: tasks.id });
    await writeTaskAttachments(
      tx,
      row!.id,
      {
        opportunityIds: t.opportunity ? [op(t.opportunity)] : [],
        contactIds: t.contact ? [ct(t.contact)] : [],
        companyIds: t.company ? [co(t.company)] : [],
      },
      { organizationId, isNew: true },
    );
  }

  console.log(
    `  ${contactRows.length} contacts, ${oppRows.length} opportunities, ${interactionRows.length} interactions, ${taskRows.length} commercial tasks`,
  );
}
