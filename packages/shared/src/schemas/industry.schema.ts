import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organization.schema';

export const industries = pgTable('industries', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, {
      onDelete: 'cascade',
    }),
});

export const industriesRelations = relations(industries, ({ one }) => ({
  organization: one(organizations, {
    fields: [industries.organizationId],
    references: [organizations.id],
  }),
}));

export type Industry = typeof industries.$inferSelect;
export type NewIndustry = typeof industries.$inferInsert;
