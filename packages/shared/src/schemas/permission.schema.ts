import { pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";

export const permissions = pgTable(
  "permissions",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(),
    label: text("label").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [unique().on(table.code)]
);

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
