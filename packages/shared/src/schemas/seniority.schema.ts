import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organization.schema';

export const seniorities = pgTable('seniorities', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, {
      onDelete: 'cascade',
    }),
});

export const senioritiesRelations = relations(seniorities, ({ one }) => ({
  organization: one(organizations, {
    fields: [seniorities.organizationId],
    references: [organizations.id],
  }),
}));

export type Seniority = typeof seniorities.$inferSelect;
export type NewSeniority = typeof seniorities.$inferInsert;
