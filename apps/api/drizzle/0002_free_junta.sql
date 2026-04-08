ALTER TABLE "candidate_vacancies" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "candidate_vacancy_statuses" ADD COLUMN "is_rejection" boolean DEFAULT false NOT NULL;