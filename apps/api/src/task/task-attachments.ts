import { AnyColumn, eq, inArray, not, or, SQL } from 'drizzle-orm';
import {
  taskCandidacies,
  taskCandidates,
  taskCompanies,
  taskContacts,
  taskOpportunities,
  tasks,
  taskVacancies,
} from '@workspace/shared/schemas';
import type {
  TaskAttachedCandidacy,
  TaskAttachedCandidate,
  TaskAttachedCompany,
  TaskAttachedContact,
  TaskAttachedOpportunity,
  TaskAttachedVacancy,
  TaskAttachmentClass,
  TaskAttachmentIds,
} from '@workspace/shared/types/task';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import type { DrizzleDatabase } from '../common/database/types/drizzle';

/**
 * Task attachments (ADR 0005): a Task attaches to any number of Candidates,
 * Vacancies, Candidacies, Companies, Contacts and Opportunities, stored in
 * one link table per type. This module is the only place that knows the link
 * tables.
 */

/** "Tasks attached to this record" filters, one per attachable type. */
export type TaskAttachedToParams = {
  candidateId?: number;
  vacancyId?: number;
  candidacyId?: number;
  companyId?: number;
  contactId?: number;
  opportunityId?: number;
};

type Executor = Pick<DrizzleDatabase, 'insert' | 'delete' | 'select'>;

/** Per type: the request list, the link table, its target column, the filter param. */
const LINKS = [
  {
    ids: 'candidateIds',
    filter: 'candidateId',
    table: taskCandidates,
    target: taskCandidates.candidateId,
  },
  {
    ids: 'vacancyIds',
    filter: 'vacancyId',
    table: taskVacancies,
    target: taskVacancies.vacancyId,
  },
  {
    ids: 'candidacyIds',
    filter: 'candidacyId',
    table: taskCandidacies,
    target: taskCandidacies.candidacyId,
  },
  {
    ids: 'companyIds',
    filter: 'companyId',
    table: taskCompanies,
    target: taskCompanies.companyId,
  },
  {
    ids: 'contactIds',
    filter: 'contactId',
    table: taskContacts,
    target: taskContacts.contactId,
  },
  {
    ids: 'opportunityIds',
    filter: 'opportunityId',
    table: taskOpportunities,
    target: taskOpportunities.opportunityId,
  },
] as const;

function linkRows(link: (typeof LINKS)[number], taskId: number, ids: number[]) {
  const targetKey = link.ids.slice(0, -1); // candidateIds -> candidateId
  return [...new Set(ids)].map((id) => ({ taskId, [targetKey]: id }));
}

/**
 * Attaches a Task to records. Each list present in `ids` replaces that
 * type's attachments (an empty list clears them); absent lists leave that
 * type untouched. Pass `{ isNew: true }` for a Task just inserted, which has
 * nothing to replace.
 */
export async function writeTaskAttachments(
  db: Executor,
  taskId: number,
  ids: TaskAttachmentIds,
  options: { isNew?: boolean } = {},
): Promise<void> {
  for (const link of LINKS) {
    const list = ids[link.ids];
    if (list === undefined) continue;
    if (!options.isNew) {
      await db.delete(link.table).where(eq(link.table.taskId, taskId));
    }
    const rows = linkRows(link, taskId, list);
    if (rows.length) {
      await db.insert(link.table).values(rows as never);
    }
  }
}

/**
 * `where` fragments for "Tasks attached to this record". A Task matches when
 * the record is among its attachments, whatever else it is attached to.
 */
export function attachedToFilters(
  db: Executor,
  params: TaskAttachedToParams,
): SQL[] {
  const filters: SQL[] = [];
  for (const link of LINKS) {
    const targetId = params[link.filter];
    if (!targetId) continue;
    filters.push(
      inArray(
        tasks.id,
        db
          .select({ taskId: link.table.taskId })
          .from(link.table)
          .where(eq(link.target, targetId)),
      ),
    );
  }
  return filters;
}

const qb = new QueryBuilder();

function attachedToAny(table: (typeof LINKS)[number]['table']): SQL {
  return inArray(tasks.id, qb.select({ taskId: table.taskId }).from(table));
}

/**
 * Commercial Tasks (see `isCommercialTask`) as a `where` fragment: any
 * Opportunity or Contact attached, or the "stayed commercial" mark.
 */
export function commercialTaskCondition(): SQL {
  return or(
    eq(tasks.stayedCommercial, true),
    attachedToAny(taskOpportunities),
    attachedToAny(taskContacts),
  )!;
}

/**
 * `where` fragment for rows tied to a Task (e.g. Notifications) that leaves
 * out those of commercial Tasks.
 */
export function notOfCommercialTask(taskIdColumn: AnyColumn): SQL {
  return not(
    inArray(
      taskIdColumn,
      qb.select({ id: tasks.id }).from(tasks).where(commercialTaskCondition()),
    ),
  );
}

/**
 * `where` fragments for who may see what and for the Tasks page pills.
 * Without commercial access, commercial Tasks are left out. `commercial`
 * keeps only commercial Tasks; `vacancies` keeps Tasks with any Vacancy,
 * Candidate or Candidacy attached.
 */
export function attachmentClassFilters(params: {
  commercialAccess: boolean;
  attachmentClass?: TaskAttachmentClass;
}): SQL[] {
  const filters: SQL[] = [];
  if (!params.commercialAccess) {
    filters.push(not(commercialTaskCondition()));
  }
  if (params.attachmentClass === 'commercial') {
    filters.push(commercialTaskCondition());
  }
  if (params.attachmentClass === 'vacancies') {
    filters.push(
      or(
        attachedToAny(taskVacancies),
        attachedToAny(taskCandidates),
        attachedToAny(taskCandidacies),
      )!,
    );
  }
  return filters;
}

/** Relational-query `with` that loads every attachment with its display fields. */
export const withTaskAttachments = {
  taskCandidates: {
    with: { candidate: { columns: { id: true, name: true } } },
  },
  taskVacancies: {
    with: { vacancy: { columns: { id: true, title: true } } },
  },
  taskCandidacies: {
    with: {
      candidacy: {
        columns: { id: true },
        with: {
          candidate: { columns: { name: true } },
          vacancy: { columns: { title: true } },
        },
      },
    },
  },
  taskCompanies: {
    with: { company: { columns: { id: true, name: true } } },
  },
  taskContacts: {
    with: { contact: { columns: { id: true, name: true } } },
  },
  taskOpportunities: {
    with: { opportunity: { columns: { id: true, title: true } } },
  },
} as const;

type LoadedAttachments = {
  taskCandidates?: { candidate: TaskAttachedCandidate | null }[];
  taskVacancies?: { vacancy: TaskAttachedVacancy | null }[];
  taskCandidacies?: {
    candidacy: {
      id: number;
      candidate: { name: string } | null;
      vacancy: { title: string } | null;
    } | null;
  }[];
  taskCompanies?: { company: TaskAttachedCompany | null }[];
  taskContacts?: { contact: TaskAttachedContact | null }[];
  taskOpportunities?: { opportunity: TaskAttachedOpportunity | null }[];
};

export type TaskAttachments = {
  candidates: TaskAttachedCandidate[];
  vacancies: TaskAttachedVacancy[];
  candidacies: TaskAttachedCandidacy[];
  companies: TaskAttachedCompany[];
  contacts: TaskAttachedContact[];
  opportunities: TaskAttachedOpportunity[];
};

const present = <X>(x: X | null | undefined): x is X => x != null;

/** Turns the loaded link rows into one list of attached records per type. */
export function flattenTaskAttachments<T extends LoadedAttachments>(
  row: T,
): Omit<T, keyof LoadedAttachments> & TaskAttachments {
  const {
    taskCandidates: candidates = [],
    taskVacancies: vacancies = [],
    taskCandidacies: candidacies = [],
    taskCompanies: companies = [],
    taskContacts: contacts = [],
    taskOpportunities: opportunities = [],
    ...rest
  } = row;
  return {
    ...rest,
    candidates: candidates.map((l) => l.candidate).filter(present),
    vacancies: vacancies.map((l) => l.vacancy).filter(present),
    candidacies: candidacies
      .map((l) => l.candidacy)
      .filter(present)
      .map((c) => ({
        id: c.id,
        candidateName: c.candidate?.name ?? '',
        vacancyTitle: c.vacancy?.title ?? '',
      })),
    companies: companies.map((l) => l.company).filter(present),
    contacts: contacts.map((l) => l.contact).filter(present),
    opportunities: opportunities.map((l) => l.opportunity).filter(present),
  };
}
