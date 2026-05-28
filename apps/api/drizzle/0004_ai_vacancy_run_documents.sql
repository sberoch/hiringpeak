ALTER TABLE "ai_vacancy_runs" ADD COLUMN "source_type" text DEFAULT 'prompt' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_vacancy_runs" ADD COLUMN "user_prompt" text;--> statement-breakpoint
CREATE TABLE "ai_vacancy_run_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" integer NOT NULL,
	"organization_id" integer NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_vacancy_run_documents" ADD CONSTRAINT "ai_vacancy_run_documents_run_id_ai_vacancy_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ai_vacancy_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_vacancy_run_documents" ADD CONSTRAINT "ai_vacancy_run_documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
