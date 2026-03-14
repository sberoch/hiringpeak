import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./organization.schema";

export const areas = pgTable("areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, {
      onDelete: "cascade",
    }),
});

export const areasRelations = relations(areas, ({ one }) => ({
  organization: one(organizations, {
    fields: [areas.organizationId],
    references: [organizations.id],
  }),
}));

export type Area = typeof areas.$inferSelect;
export type NewArea = typeof areas.$inferInsert;
