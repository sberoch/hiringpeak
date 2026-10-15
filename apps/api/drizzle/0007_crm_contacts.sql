CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"company_id" integer,
	"name" text NOT NULL,
	"role" text DEFAULT '' NOT NULL,
	"email" text,
	"phone" text,
	"linkedin" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vacancies" ADD COLUMN "vacancy_contact_id" integer;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contacts_organization_id_idx" ON "contacts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "contacts_company_id_idx" ON "contacts" USING btree ("company_id");--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_vacancy_contact_id_contacts_id_fk" FOREIGN KEY ("vacancy_contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Data: each Company's embedded client contact becomes one Contact employed by
-- that Company (role empty, no creator), set as Vacancy Contact on all of the
-- Company's Vacancies. Runs before the embedded columns are dropped.
WITH "migrated_contacts" AS (
	INSERT INTO "contacts" ("organization_id", "company_id", "name", "role", "email", "phone")
	SELECT
		c."organization_id",
		c."id",
		COALESCE(NULLIF(btrim(c."client_name"), ''), 'Contacto de ' || c."name"),
		'',
		NULLIF(btrim(c."client_email"), ''),
		NULLIF(btrim(c."client_phone"), '')
	FROM "companies" c
	WHERE NULLIF(btrim(c."client_name"), '') IS NOT NULL
		OR NULLIF(btrim(c."client_email"), '') IS NOT NULL
		OR NULLIF(btrim(c."client_phone"), '') IS NOT NULL
	RETURNING "id", "company_id"
)
UPDATE "vacancies" v
SET "vacancy_contact_id" = mc."id"
FROM "migrated_contacts" mc
WHERE v."company_id" = mc."company_id";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "client_name";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "client_email";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "client_phone";