import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organization.schema';

export const candidateSources = pgTable('candidate_sources', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, {
      onDelete: 'cascade',
    }),
});

export const candidateSourcesRelations = relations(
  candidateSources,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [candidateSources.organizationId],
      references: [organizations.id],
    }),
  })
);

export type CandidateSource = typeof candidateSources.$inferSelect;
export type NewCandidateSource = typeof candidateSources.$inferInsert;
