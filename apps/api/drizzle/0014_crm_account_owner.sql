ALTER TABLE "companies" ADD COLUMN "account_owner_id" integer;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_account_owner_id_users_id_fk" FOREIGN KEY ("account_owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "companies_account_owner_id_idx" ON "companies" USING btree ("account_owner_id");--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "status";--> statement-breakpoint
DROP TYPE "public"."companyStatus";