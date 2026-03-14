ALTER TYPE "public"."role" ADD VALUE 'SYSTEM_ADMIN';--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "candidates" DROP CONSTRAINT "candidates_name_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "areas" ADD COLUMN "organization_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "blacklists" ADD COLUMN "organization_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "organization_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "candidate_files" ADD COLUMN "organization_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "candidate_sources" ADD COLUMN "organization_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "candidate_vacancies" ADD COLUMN "organization_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "candidate_vacancy_statuses" ADD COLUMN "organization_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "organization_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "organization_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "industries" ADD COLUMN "organization_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "seniorities" ADD COLUMN "organization_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "vacancies" ADD COLUMN "organization_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "vacancy_filters" ADD COLUMN "organization_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "vacancy_statuses" ADD COLUMN "organization_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "areas" ADD CONSTRAINT "areas_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blacklists" ADD CONSTRAINT "blacklists_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_files" ADD CONSTRAINT "candidate_files_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_sources" ADD CONSTRAINT "candidate_sources_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_vacancies" ADD CONSTRAINT "candidate_vacancies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_vacancy_statuses" ADD CONSTRAINT "candidate_vacancy_statuses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "industries" ADD CONSTRAINT "industries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seniorities" ADD CONSTRAINT "seniorities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_filters" ADD CONSTRAINT "vacancy_filters_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_statuses" ADD CONSTRAINT "vacancy_statuses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_name_organization_id_unique" UNIQUE("name","organization_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_organization_id_unique" UNIQUE("email","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_system_admin_unique" ON "users" ("email") WHERE "organization_id" IS NULL;