CREATE TABLE "ai_vacancy_run_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" integer NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_vacancy_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_token" text NOT NULL,
	"organization_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"prompt" text NOT NULL,
	"model" text NOT NULL,
	"status" text NOT NULL,
	"response_text" text,
	"draft" jsonb,
	"extraction_metadata" jsonb,
	"total_usage" jsonb,
	"error_message" text,
	"latency_ms" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vacancies" ADD COLUMN "ai_vacancy_run_id" integer;--> statement-breakpoint
ALTER TABLE "ai_vacancy_run_events" ADD CONSTRAINT "ai_vacancy_run_events_run_id_ai_vacancy_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ai_vacancy_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_vacancy_runs" ADD CONSTRAINT "ai_vacancy_runs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_vacancy_runs" ADD CONSTRAINT "ai_vacancy_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_vacancy_runs_public_token_unique" ON "ai_vacancy_runs" USING btree ("public_token");--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_ai_vacancy_run_id_ai_vacancy_runs_id_fk" FOREIGN KEY ("ai_vacancy_run_id") REFERENCES "public"."ai_vacancy_runs"("id") ON DELETE set null ON UPDATE no action;