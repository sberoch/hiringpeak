CREATE TABLE "task_contacts" (
	"task_id" integer NOT NULL,
	"contact_id" integer NOT NULL,
	CONSTRAINT "task_contacts_task_id_contact_id_pk" PRIMARY KEY("task_id","contact_id")
);
--> statement-breakpoint
CREATE TABLE "task_opportunities" (
	"task_id" integer NOT NULL,
	"opportunity_id" integer NOT NULL,
	CONSTRAINT "task_opportunities_task_id_opportunity_id_pk" PRIMARY KEY("task_id","opportunity_id")
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "stayed_commercial" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "task_contacts" ADD CONSTRAINT "task_contacts_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_contacts" ADD CONSTRAINT "task_contacts_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_opportunities" ADD CONSTRAINT "task_opportunities_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_opportunities" ADD CONSTRAINT "task_opportunities_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_contacts_contact_id_idx" ON "task_contacts" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "task_opportunities_opportunity_id_idx" ON "task_opportunities" USING btree ("opportunity_id");