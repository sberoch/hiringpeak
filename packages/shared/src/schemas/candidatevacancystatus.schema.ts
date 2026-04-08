import { boolean, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organization.schema';

export const candidateVacancyStatuses = pgTable('candidate_vacancy_statuses', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sort: integer('sort').notNull(),
  isInitial: boolean('is_initial').notNull(),
  isRejection: boolean('is_rejection').notNull().default(false),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, {
      onDelete: 'cascade',
    }),
});

export const candidateVacancyStatusesRelations = relations(
  candidateVacancyStatuses,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [candidateVacancyStatuses.organizationId],
      references: [organizations.id],
    }),
  })
);

export type CandidateVacancyStatus =
  typeof candidateVacancyStatuses.$inferSelect;
export type NewCandidateVacancyStatus =
  typeof candidateVacancyStatuses.$inferInsert;
