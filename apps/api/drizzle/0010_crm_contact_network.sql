CREATE TABLE "contact_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort" integer NOT NULL,
	"organization_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "source_id" integer;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "owner_id" integer;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "short_description" text;--> statement-breakpoint
ALTER TABLE "contact_sources" ADD CONSTRAINT "contact_sources_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_source_id_contact_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."contact_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contacts_owner_id_idx" ON "contacts" USING btree ("owner_id");
--> statement-breakpoint
-- Default Contact Sources for every existing Organization (new ones are seeded at Onboarding from DEFAULT_CONTACT_SOURCES; keep both lists identical).
INSERT INTO "contact_sources" ("organization_id","name","sort")
SELECT o.id, v.name, v.sort FROM "organizations" o
CROSS JOIN (VALUES ('Evento',0),('Referido',1),('LinkedIn',2),('Cliente actual',3)) AS v(name,sort);
