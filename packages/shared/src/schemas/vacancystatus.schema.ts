import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const vacancyStatuses = pgTable('vacancy_statuses', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
});

export type VacancyStatus = typeof vacancyStatuses.$inferSelect;
export type NewVacancyStatus = typeof vacancyStatuses.$inferInsert;
