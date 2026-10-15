import { describe, expect, it } from 'vitest';
import { getTableConfig } from 'drizzle-orm/pg-core';
import {
  candidateVacancies,
  candidates,
  companies,
  taskCandidacies,
  taskCandidates,
  taskCompanies,
  tasks,
  taskVacancies,
  vacancies,
} from '@workspace/shared/schemas';

/**
 * Deleting an attached record removes only that attachment and the Task
 * survives; deleting the Task removes its attachments. Both are guaranteed by
 * the link tables' foreign keys cascading on both sides (ADR 0005).
 */
describe.each([
  ['Candidate', taskCandidates, candidates],
  ['Vacancy', taskVacancies, vacancies],
  ['Candidacy', taskCandidacies, candidateVacancies],
  ['Company', taskCompanies, companies],
] as const)('a Task attached to a %s', (_name, linkTable, targetTable) => {
  const foreignKeys = getTableConfig(linkTable).foreignKeys.map((fk) => ({
    target: fk.reference().foreignTable,
    onDelete: fk.onDelete,
  }));

  it('loses only the link when the record is deleted', () => {
    expect(foreignKeys).toContainEqual({
      target: targetTable,
      onDelete: 'cascade',
    });
  });

  it('takes the link with it when the Task is deleted', () => {
    expect(foreignKeys).toContainEqual({ target: tasks, onDelete: 'cascade' });
  });
});

it('a Task no longer carries a single attachment column per type', () => {
  const columns = getTableConfig(tasks).columns.map((c) => c.name);
  expect(columns).not.toContain('candidate_id');
  expect(columns).not.toContain('vacancy_id');
  expect(columns).not.toContain('company_id');
});
