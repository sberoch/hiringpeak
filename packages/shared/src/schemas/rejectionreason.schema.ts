import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organization.schema';

export const rejectionReasons = pgTable('rejection_reasons', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sort: integer('sort').notNull(),
  organizationId: integer('organization_id')
    .notNull()
    .references(() => organizations.id, {
      onDelete: 'cascade',
    }),
});

export const rejectionReasonsRelations = relations(
  rejectionReasons,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [rejectionReasons.organizationId],
      references: [organizations.id],
    }),
  })
);

export type RejectionReason = typeof rejectionReasons.$inferSelect;
export type NewRejectionReason = typeof rejectionReasons.$inferInsert;
