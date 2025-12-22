import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { candidates } from './candidate.schema.js';
import { users } from './user.schema.js';

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  candidateId: integer('candidate_id')
    .notNull()
    .references(() => candidates.id, {
      onDelete: 'cascade',
    }),
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, {
      onDelete: 'cascade',
    }),
});

export const commentRelations = relations(comments, ({ one }) => ({
  candidate: one(candidates, {
    fields: [comments.candidateId],
    references: [candidates.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
