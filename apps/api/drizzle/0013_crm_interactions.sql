CREATE TYPE "public"."interactionType" AS ENUM('call', 'meeting', 'email', 'lunch', 'other');--> statement-breakpoint
CREATE TABLE "interaction_contacts" (
	"interaction_id" integer NOT NULL,
	"contact_id" integer NOT NULL,
	CONSTRAINT "interaction_contacts_interaction_id_contact_id_pk" PRIMARY KEY("interaction_id","contact_id")
);
--> statement-breakpoint
CREATE TABLE "interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"type" "interactionType" NOT NULL,
	"date" date NOT NULL,
	"summary" text NOT NULL,
	"company_id" integer,
	"opportunity_id" integer,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "interaction_contacts" ADD CONSTRAINT "interaction_contacts_interaction_id_interactions_id_fk" FOREIGN KEY ("interaction_id") REFERENCES "public"."interactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interaction_contacts" ADD CONSTRAINT "interaction_contacts_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "interaction_contacts_contact_id_idx" ON "interaction_contacts" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "interactions_organization_id_idx" ON "interactions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "interactions_company_id_idx" ON "interactions" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "interactions_opportunity_id_idx" ON "interactions" USING btree ("opportunity_id");