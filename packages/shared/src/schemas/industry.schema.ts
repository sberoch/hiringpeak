import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const industries = pgTable('industries', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
});

export type Industry = typeof industries.$inferSelect;
export type NewIndustry = typeof industries.$inferInsert;
