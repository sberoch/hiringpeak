import { eq, inArray, SQL } from 'drizzle-orm';
import {
  taskCandidacies,
  taskCandidates,
  taskCompanies,
  tasks,
  taskVacancies,
} from '@workspace/shared/schemas';
import type {
  TaskAttachedCandidacy,
  TaskAttachedCandidate,
  TaskAttachedCompany,
  TaskAttachedVacancy,
  TaskAttachmentIds,
} from '@workspace/shared/types/task';
import type { DrizzleDatabase } from '../common/database/types/drizzle';

/**
 * Task attachments (ADR 0005): a Task attaches to any number of Candidates,
 * Vacancies, Candidacies and Companies, stored in one link table per type.
 * This module is the only place that knows the link tables.
 */

/** "Tasks attached to this record" filters, one per attachable type. */
export type TaskAttachedToParams = {
  candidateId?: number;
  vacancyId?: number;
  candidacyId?: number;
  companyId?: number;
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
};

export type TaskAttachments = {
  candidates: TaskAttachedCandidate[];
  vacancies: TaskAttachedVacancy[];
  candidacies: TaskAttachedCandidacy[];
  companies: TaskAttachedCompany[];
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
  };
}
