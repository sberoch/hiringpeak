ALTER TABLE "vacancies" ADD COLUMN "salary" text;--> statement-breakpoint
ALTER TABLE "vacancies" ADD COLUMN "closed_at" timestamp;--> statement-breakpoint
ALTER TABLE "vacancy_statuses" ADD COLUMN "is_final" boolean DEFAULT false NOT NULL;