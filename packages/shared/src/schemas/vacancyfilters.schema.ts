import { integer, numeric, pgTable, serial, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { seniorities } from "./seniority.schema";
import { areas } from "./area.schema";
import { industries } from "./industry.schema";
import { organizations } from "./organization.schema";

export const vacancyFilters = pgTable("vacancy_filters", {
  id: serial("id").primaryKey(),
  minStars: numeric("min_stars"),
  gender: text("gender"),
  minAge: integer("min_age"),
  maxAge: integer("max_age"),
  countries: text("countries").array(),
  provinces: text("provinces").array(),
  languages: text("languages").array(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, {
      onDelete: "cascade",
    }),
});

export const vacancyFiltersRelations = relations(
  vacancyFilters,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [vacancyFilters.organizationId],
      references: [organizations.id],
    }),
    seniorityIds: many(vacancyFiltersSeniorities),
    areaIds: many(vacancyFiltersAreas),
    industryIds: many(vacancyFiltersIndustries),
  })
);

export const vacancyFiltersSeniorities = pgTable(
  "vacancy_filters_seniorities",
  {
    id: serial("id").primaryKey(),
    vacancyFiltersId: integer("vacancy_filters_id")
      .references(() => vacancyFilters.id, { onDelete: "cascade" })
      .notNull(),
    seniorityId: integer("seniority_id")
      .references(() => seniorities.id, { onDelete: "cascade" })
      .notNull(),
  }
);

export const vacancyFiltersSenioritiesRelations = relations(
  vacancyFiltersSeniorities,
  ({ one }) => ({
    vacancyFilters: one(vacancyFilters, {
      fields: [vacancyFiltersSeniorities.vacancyFiltersId],
      references: [vacancyFilters.id],
    }),
    seniority: one(seniorities, {
      fields: [vacancyFiltersSeniorities.seniorityId],
      references: [seniorities.id],
    }),
  })
);

export const vacancyFiltersAreas = pgTable("vacancy_filters_areas", {
  id: serial("id").primaryKey(),
  vacancyFiltersId: integer("vacancy_filters_id")
    .references(() => vacancyFilters.id, { onDelete: "cascade" })
    .notNull(),
  areaId: integer("area_id")
    .references(() => areas.id, { onDelete: "cascade" })
    .notNull(),
});

export const vacancyFiltersAreasRelations = relations(
  vacancyFiltersAreas,
  ({ one }) => ({
    vacancyFilters: one(vacancyFilters, {
      fields: [vacancyFiltersAreas.vacancyFiltersId],
      references: [vacancyFilters.id],
    }),
    area: one(areas, {
      fields: [vacancyFiltersAreas.areaId],
      references: [areas.id],
    }),
  })
);

export const vacancyFiltersIndustries = pgTable("vacancy_filters_industries", {
  id: serial("id").primaryKey(),
  vacancyFiltersId: integer("vacancy_filters_id")
    .references(() => vacancyFilters.id, { onDelete: "cascade" })
    .notNull(),
  industryId: integer("industry_id")
    .references(() => industries.id, { onDelete: "cascade" })
    .notNull(),
});

export const vacancyFiltersIndustriesRelations = relations(
  vacancyFiltersIndustries,
  ({ one }) => ({
    vacancyFilters: one(vacancyFilters, {
      fields: [vacancyFiltersIndustries.vacancyFiltersId],
      references: [vacancyFilters.id],
    }),
    industry: one(industries, {
      fields: [vacancyFiltersIndustries.industryId],
      references: [industries.id],
    }),
  })
);

export type VacancyFiltersSeniority =
  typeof vacancyFiltersSeniorities.$inferSelect;
export type NewVacancyFiltersSeniority =
  typeof vacancyFiltersSeniorities.$inferInsert;

export type VacancyFiltersArea = typeof vacancyFiltersAreas.$inferSelect;
export type NewVacancyFiltersArea = typeof vacancyFiltersAreas.$inferInsert;

export type VacancyFiltersIndustry =
  typeof vacancyFiltersIndustries.$inferSelect;
export type NewVacancyFiltersIndustry =
  typeof vacancyFiltersIndustries.$inferInsert;

export type VacancyFilters = typeof vacancyFilters.$inferSelect;
export type NewVacancyFilters = typeof vacancyFilters.$inferInsert;
