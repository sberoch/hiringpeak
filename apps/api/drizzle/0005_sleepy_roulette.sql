ALTER TABLE "tasks" DROP CONSTRAINT "tasks_candidate_vacancy_id_candidate_vacancies_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "candidate_vacancy_id";