import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const candidateFiles = pgTable('candidate_files', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull(),
});

export type CandidateFile = typeof candidateFiles.$inferSelect;
export type NewCandidateFile = typeof candidateFiles.$inferInsert;
