import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const areas = pgTable("areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export type Area = typeof areas.$inferSelect;
export type NewArea = typeof areas.$inferInsert;
