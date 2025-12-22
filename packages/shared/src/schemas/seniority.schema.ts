import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const seniorities = pgTable('seniorities', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
});

export type Seniority = typeof seniorities.$inferSelect;
export type NewSeniority = typeof seniorities.$inferInsert;
