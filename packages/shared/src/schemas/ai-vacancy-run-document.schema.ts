import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { aiVacancyRuns } from "./ai-vacancy-run.schema";
import { organizations } from "./organization.schema";

export const aiVacancyRunDocuments = pgTable("ai_vacancy_run_documents", {
  id: serial("id").primaryKey(),
  runId: integer("run_id")
    .notNull()
    .references(() => aiVacancyRuns.id, {
      onDelete: "cascade",
    }),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, {
      onDelete: "cascade",
    }),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const aiVacancyRunDocumentsRelations = relations(
  aiVacancyRunDocuments,
  ({ one }) => ({
    run: one(aiVacancyRuns, {
      fields: [aiVacancyRunDocuments.runId],
      references: [aiVacancyRuns.id],
    }),
    organization: one(organizations, {
      fields: [aiVacancyRunDocuments.organizationId],
      references: [organizations.id],
    }),
  }),
);

export type AiVacancyRunDocument =
  typeof aiVacancyRunDocuments.$inferSelect;
export type NewAiVacancyRunDocument =
  typeof aiVacancyRunDocuments.$inferInsert;
