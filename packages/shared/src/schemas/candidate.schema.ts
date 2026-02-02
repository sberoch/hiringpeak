import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { areas } from "./area.schema";
import { candidateFiles } from "./candidatefile.schema";
import { candidateSources } from "./candidatesource.schema";
import { industries } from "./industry.schema";
import { seniorities } from "./seniority.schema";
import { blacklists } from "./blacklist.schema";
import { comments } from "./comment.schema";

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  image: text("image"),
  dateOfBirth: date("date_of_birth"),
  gender: text("gender"),
  shortDescription: text("short_description"),
  email: text("email").notNull(),
  linkedin: text("linkedin"),
  address: text("address"),
  phone: text("phone"),
  deleted: boolean("deleted").default(false),
  sourceId: integer("source_id").references(() => candidateSources.id, {
    onDelete: "cascade",
  }),
  stars: numeric("stars"),
  isInCompanyViaPratt: boolean("is_in_company_via_pratt"),
  countries: text("countries").array().default([]),
  provinces: text("provinces").array().default([]),
  languages: text("languages").array().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  source: one(candidateSources, {
    fields: [candidates.sourceId],
    references: [candidateSources.id],
  }),
  candidateAreas: many(candidateAreas),
  candidateIndustries: many(candidateIndustries),
  candidateSeniorities: many(candidateSeniorities),
  candidateFilesRelation: many(candidateFilesRelation),
  blacklist: one(blacklists, {
    fields: [candidates.id],
    references: [blacklists.candidateId],
  }),
  comments: many(comments),
}));

export const candidateAreas = pgTable("candidate_areas", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id")
    .references(() => candidates.id, { onDelete: "cascade" })
    .notNull(),
  areaId: integer("area_id")
    .references(() => areas.id, { onDelete: "cascade" })
    .notNull(),
});

export const candidateAreasRelations = relations(candidateAreas, ({ one }) => ({
  candidate: one(candidates, {
    fields: [candidateAreas.candidateId],
    references: [candidates.id],
  }),
  area: one(areas, {
    fields: [candidateAreas.areaId],
    references: [areas.id],
  }),
}));

export const candidateIndustries = pgTable("candidate_industries", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id")
    .references(() => candidates.id, { onDelete: "cascade" })
    .notNull(),
  industryId: integer("industry_id")
    .references(() => industries.id, { onDelete: "cascade" })
    .notNull(),
});

export const candidateIndustriesRelations = relations(
  candidateIndustries,
  ({ one }) => ({
    candidate: one(candidates, {
      fields: [candidateIndustries.candidateId],
      references: [candidates.id],
    }),
    industry: one(industries, {
      fields: [candidateIndustries.industryId],
      references: [industries.id],
    }),
  })
);

export const candidateSeniorities = pgTable("candidate_seniorities", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id")
    .references(() => candidates.id, { onDelete: "cascade" })
    .notNull(),
  seniorityId: integer("seniority_id")
    .references(() => seniorities.id, { onDelete: "cascade" })
    .notNull(),
});

export const candidateSenioritiesRelations = relations(
  candidateSeniorities,
  ({ one }) => ({
    candidate: one(candidates, {
      fields: [candidateSeniorities.candidateId],
      references: [candidates.id],
    }),
    seniority: one(seniorities, {
      fields: [candidateSeniorities.seniorityId],
      references: [seniorities.id],
    }),
  })
);

export const candidateFilesRelation = pgTable("candidate_candidate_files", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id")
    .references(() => candidates.id, { onDelete: "cascade" })
    .notNull(),
  fileId: integer("file_id")
    .references(() => candidateFiles.id, { onDelete: "cascade" })
    .notNull(),
});

export const candidateFilesRelationRelations = relations(
  candidateFilesRelation,
  ({ one }) => ({
    candidate: one(candidates, {
      fields: [candidateFilesRelation.candidateId],
      references: [candidates.id],
    }),
    file: one(candidateFiles, {
      fields: [candidateFilesRelation.fileId],
      references: [candidateFiles.id],
    }),
  })
);

export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;
