import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  /** Branding: the downscaled logo shown in the sidebar and the PDFs. */
  logoUrl: text("logo_url"),
  /** Branding: the logo as uploaded, kept only to downscale it again later. */
  originalLogoUrl: text("original_logo_url"),
  /** Branding: accent color as `#RRGGBB`. */
  accentColor: text("accent_color"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
