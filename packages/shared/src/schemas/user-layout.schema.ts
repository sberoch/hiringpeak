import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import type { SavedLayoutEntry } from "../lib/layout";
import { users } from "./user.schema";

/**
 * A User's saved layout for one layout key (a list screen's Column Layout
 * or a dashboard Widget Area). Personal preference: removed with the User.
 */
export const userLayouts = pgTable(
  "user_layouts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    layoutKey: text("layout_key").notNull(),
    value: jsonb("value").$type<SavedLayoutEntry[]>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("user_layouts_user_id_layout_key_unique").on(
      table.userId,
      table.layoutKey,
    ),
  ],
);

export type UserLayout = typeof userLayouts.$inferSelect;
