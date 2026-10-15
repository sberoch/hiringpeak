CREATE TABLE "opportunity_contacts" (
	"opportunity_id" integer NOT NULL,
	"contact_id" integer NOT NULL,
	CONSTRAINT "opportunity_contacts_opportunity_id_contact_id_pk" PRIMARY KEY("opportunity_id","contact_id")
);
--> statement-breakpoint
ALTER TABLE "opportunity_contacts" ADD CONSTRAINT "opportunity_contacts_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_contacts" ADD CONSTRAINT "opportunity_contacts_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "opportunity_contacts_contact_id_idx" ON "opportunity_contacts" USING btree ("contact_id");