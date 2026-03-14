import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organization.schema';

export const candidateFiles = pgTable('candidate_files', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, {
      onDelete: 'cascade',
    }),
});

export const candidateFilesRelations = relations(
  candidateFiles,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [candidateFiles.organizationId],
      references: [organizations.id],
    }),
  })
);

export type CandidateFile = typeof candidateFiles.$inferSelect;
export type NewCandidateFile = typeof candidateFiles.$inferInsert;
