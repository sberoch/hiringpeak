import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { JsonValue } from "../types/vacancy-ai";
import { organizations } from "./organization.schema";
import { users } from "./user.schema";

export const aiVacancyRuns = pgTable(
  "ai_vacancy_runs",
  {
    id: serial("id").primaryKey(),
    publicToken: text("public_token").notNull(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
      }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    prompt: text("prompt").notNull(),
    model: text("model").notNull(),
    status: text("status").notNull(),
    responseText: text("response_text"),
    draft: jsonb("draft").$type<JsonValue>(),
    extractionMetadata: jsonb("extraction_metadata").$type<JsonValue>(),
    totalUsage: jsonb("total_usage").$type<JsonValue>(),
    errorMessage: text("error_message"),
    latencyMs: integer("latency_ms").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    publicTokenUnique: uniqueIndex("ai_vacancy_runs_public_token_unique").on(
      table.publicToken,
    ),
  }),
);

export const aiVacancyRunEvents = pgTable("ai_vacancy_run_events", {
  id: serial("id").primaryKey(),
  runId: integer("run_id")
    .notNull()
    .references(() => aiVacancyRuns.id, {
      onDelete: "cascade",
    }),
  type: text("type").notNull(),
  payload: jsonb("payload").$type<JsonValue>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const aiVacancyRunsRelations = relations(
  aiVacancyRuns,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [aiVacancyRuns.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [aiVacancyRuns.userId],
      references: [users.id],
    }),
    events: many(aiVacancyRunEvents),
  }),
);

export const aiVacancyRunEventsRelations = relations(
  aiVacancyRunEvents,
  ({ one }) => ({
    run: one(aiVacancyRuns, {
      fields: [aiVacancyRunEvents.runId],
      references: [aiVacancyRuns.id],
    }),
  }),
);

export type AiVacancyRun = typeof aiVacancyRuns.$inferSelect;
export type NewAiVacancyRun = typeof aiVacancyRuns.$inferInsert;
export type AiVacancyRunEvent = typeof aiVacancyRunEvents.$inferSelect;
export type NewAiVacancyRunEvent = typeof aiVacancyRunEvents.$inferInsert;
