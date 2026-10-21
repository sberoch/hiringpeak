import { inArray } from 'drizzle-orm';
import {
  candidateVacancies,
  candidateVacancyStatuses,
  candidates,
  companies,
  contacts,
  opportunities,
  opportunityStages,
  organizations,
  permissions,
  rolePermissions,
  roles,
  users,
  vacancies,
  vacancyStatuses,
  type NewOpportunityStage as NewStage,
} from '@workspace/shared/schemas';
import type { DrizzleDatabase } from '../types/drizzle';

/**
 * Arrange-step builders for specs on the test database (see
 * `createTestDatabase`): each inserts one record with sensible defaults and
 * returns its id. Behaviour is then exercised and observed through services.
 */
export function fixtures(db: DrizzleDatabase) {
  let seq = 0;
  const next = () => ++seq;

  const insertId = async (
    table: Parameters<DrizzleDatabase['insert']>[0],
    values: Record<string, unknown>,
  ) => {
    const [row] = (await db
      .insert(table)
      .values(values as never)
      .returning()) as { id: number }[];
    return row.id;
  };

  return {
    organization: (name = `Org ${next()}`) => insertId(organizations, { name }),

    /** A User whose Role grants exactly `codes`. */
    async user(organizationId: number, codes: string[], name?: string) {
      const n = next();
      if (codes.length) {
        await db
          .insert(permissions)
          .values(codes.map((code) => ({ code, label: code })))
          .onConflictDoNothing();
      }
      const roleId = await insertId(roles, {
        organizationId,
        name: `Role ${n}`,
      });
      if (codes.length) {
        const granted = await db
          .select({ id: permissions.id })
          .from(permissions)
          .where(inArray(permissions.code, codes));
        await db
          .insert(rolePermissions)
          .values(granted.map((p) => ({ roleId, permissionId: p.id })));
      }
      return insertId(users, {
        organizationId,
        roleId,
        name: name ?? `User ${n}`,
        email: `user${n}@example.com`,
        password: 'x',
      });
    },

    /** A User holding an existing Role (e.g. a default Role). */
    member(organizationId: number, roleId: number) {
      const n = next();
      return insertId(users, {
        organizationId,
        roleId,
        name: `User ${n}`,
        email: `user${n}@example.com`,
        password: 'x',
      });
    },

    company: (
      organizationId: number,
      fields: { name?: string; accountOwnerId?: number | null } = {},
    ) =>
      insertId(companies, {
        organizationId,
        name: fields.name ?? `Company ${next()}`,
        description: '',
        accountOwnerId: fields.accountOwnerId ?? null,
      }),

    contact: (
      organizationId: number,
      fields: { name?: string; companyId?: number | null } = {},
    ) =>
      insertId(contacts, {
        organizationId,
        name: fields.name ?? `Contact ${next()}`,
        companyId: fields.companyId ?? null,
      }),

    /** Two open stages, then won and lost. */
    async stages(organizationId: number) {
      const values = [
        { organizationId, name: 'Primer contacto', sort: 1 },
        { organizationId, name: 'Propuesta', sort: 2 },
        { organizationId, name: 'Ganada', sort: 3, isWon: true },
        { organizationId, name: 'Perdida', sort: 4, isLost: true },
      ] as NewStage[];
      const rows = await db
        .insert(opportunityStages)
        .values(values)
        .returning();
      const [open, proposal, won, lost] = rows.map((r) => r.id);
      return { open, proposal, won, lost };
    },

    opportunity: (
      organizationId: number,
      fields: {
        companyId: number;
        ownerId: number;
        stageId: number;
        title?: string;
      },
    ) =>
      insertId(opportunities, {
        organizationId,
        createdBy: fields.ownerId,
        title: fields.title ?? `Opportunity ${next()}`,
        ...fields,
      }),

    vacancy: (
      organizationId: number,
      fields: {
        companyId: number;
        createdBy: number;
        title?: string;
        opportunityId?: number | null;
        vacancyContactId?: number | null;
        statusId?: number | null;
        createdAt?: Date;
        updatedAt?: Date;
      },
    ) =>
      insertId(vacancies, {
        organizationId,
        description: '',
        assignedTo: fields.createdBy,
        title: fields.title ?? `Vacancy ${next()}`,
        ...fields,
      }),

    vacancyStatus: (
      organizationId: number,
      name = 'Abierta',
      fields: { isFinal?: boolean } = {},
    ) =>
      insertId(vacancyStatuses, {
        organizationId,
        name,
        isFinal: fields.isFinal ?? false,
      }),

    candidate: (organizationId: number, name = `Candidate ${next()}`) =>
      insertId(candidates, {
        organizationId,
        name,
        email: `c${next()}@example.com`,
      }),

    async candidacy(
      organizationId: number,
      fields: { candidateId: number; vacancyId: number },
    ) {
      const statusId = await insertId(candidateVacancyStatuses, {
        organizationId,
        name: `Status ${next()}`,
        sort: seq,
        isInitial: false,
      });
      return insertId(candidateVacancies, {
        organizationId,
        candidateVacancyStatusId: statusId,
        ...fields,
      });
    },
  };
}
