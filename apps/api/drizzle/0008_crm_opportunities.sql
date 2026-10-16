CREATE TABLE "lost_reasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort" integer NOT NULL,
	"organization_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"company_id" integer NOT NULL,
	"stage_id" integer NOT NULL,
	"owner_id" integer NOT NULL,
	"estimated_fee" numeric(14, 2),
	"lost_reason_id" integer,
	"close_date" date,
	"created_by" integer NOT NULL,
	"organization_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunity_stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort" integer NOT NULL,
	"is_won" boolean DEFAULT false NOT NULL,
	"is_lost" boolean DEFAULT false NOT NULL,
	"organization_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lost_reasons" ADD CONSTRAINT "lost_reasons_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_stage_id_opportunity_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."opportunity_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_lost_reason_id_lost_reasons_id_fk" FOREIGN KEY ("lost_reason_id") REFERENCES "public"."lost_reasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_stages" ADD CONSTRAINT "opportunity_stages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "opportunities_organization_id_idx" ON "opportunities" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "opportunities_company_id_idx" ON "opportunities" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "opportunities_stage_id_idx" ON "opportunities" USING btree ("stage_id");--> statement-breakpoint
-- Default Opportunity Stages and Lost Reasons for every existing Organization.
-- New Organizations get the same lists during Onboarding
-- (packages/shared/src/static/commercial-defaults.ts) — keep both in sync.
INSERT INTO "opportunity_stages" ("organization_id", "name", "sort", "is_won", "is_lost")
SELECT o.id, v.name, v.sort, v.is_won, v.is_lost
FROM "organizations" o
CROSS JOIN (VALUES
  ('Primer contacto', 0, false, false),
  ('Reunión', 1, false, false),
  ('Propuesta enviada', 2, false, false),
  ('Negociación', 3, false, false),
  ('Ganada', 4, true, false),
  ('Perdida', 5, false, true)
) AS v(name, sort, is_won, is_lost);--> statement-breakpoint
INSERT INTO "lost_reasons" ("organization_id", "name", "sort")
SELECT o.id, v.name, v.sort
FROM "organizations" o
CROSS JOIN (VALUES
  ('Precio', 0),
  ('Eligió otra consultora', 1),
  ('Se canceló la búsqueda', 2),
  ('Sin respuesta', 3),
  ('Otro', 4)
) AS v(name, sort);