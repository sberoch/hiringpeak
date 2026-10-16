ALTER TABLE "vacancies" ADD COLUMN "opportunity_id" integer;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vacancies_opportunity_id_idx" ON "vacancies" USING btree ("opportunity_id");