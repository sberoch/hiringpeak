import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organization.schema';

export const vacancyStatuses = pgTable('vacancy_statuses', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, {
      onDelete: 'cascade',
    }),
});

export const vacancyStatusesRelations = relations(
  vacancyStatuses,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [vacancyStatuses.organizationId],
      references: [organizations.id],
    }),
  })
);

export type VacancyStatus = typeof vacancyStatuses.$inferSelect;
export type NewVacancyStatus = typeof vacancyStatuses.$inferInsert;
