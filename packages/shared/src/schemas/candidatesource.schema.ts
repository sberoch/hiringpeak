import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const candidateSources = pgTable('candidate_sources', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
});

export type CandidateSource = typeof candidateSources.$inferSelect;
export type NewCandidateSource = typeof candidateSources.$inferInsert;
