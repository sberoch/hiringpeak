CREATE TABLE "task_candidacies" (
	"task_id" integer NOT NULL,
	"candidacy_id" integer NOT NULL,
	CONSTRAINT "task_candidacies_task_id_candidacy_id_pk" PRIMARY KEY("task_id","candidacy_id")
);
--> statement-breakpoint
CREATE TABLE "task_candidates" (
	"task_id" integer NOT NULL,
	"candidate_id" integer NOT NULL,
	CONSTRAINT "task_candidates_task_id_candidate_id_pk" PRIMARY KEY("task_id","candidate_id")
);
--> statement-breakpoint
CREATE TABLE "task_companies" (
	"task_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	CONSTRAINT "task_companies_task_id_company_id_pk" PRIMARY KEY("task_id","company_id")
);
--> statement-breakpoint
CREATE TABLE "task_vacancies" (
	"task_id" integer NOT NULL,
	"vacancy_id" integer NOT NULL,
	CONSTRAINT "task_vacancies_task_id_vacancy_id_pk" PRIMARY KEY("task_id","vacancy_id")
);
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_candidate_id_candidates_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_vacancy_id_vacancies_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "task_candidacies" ADD CONSTRAINT "task_candidacies_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_candidacies" ADD CONSTRAINT "task_candidacies_candidacy_id_candidate_vacancies_id_fk" FOREIGN KEY ("candidacy_id") REFERENCES "public"."candidate_vacancies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_candidates" ADD CONSTRAINT "task_candidates_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_candidates" ADD CONSTRAINT "task_candidates_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_companies" ADD CONSTRAINT "task_companies_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_companies" ADD CONSTRAINT "task_companies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_vacancies" ADD CONSTRAINT "task_vacancies_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_vacancies" ADD CONSTRAINT "task_vacancies_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_candidacies_candidacy_id_idx" ON "task_candidacies" USING btree ("candidacy_id");--> statement-breakpoint
CREATE INDEX "task_candidates_candidate_id_idx" ON "task_candidates" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "task_companies_company_id_idx" ON "task_companies" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "task_vacancies_vacancy_id_idx" ON "task_vacancies" USING btree ("vacancy_id");--> statement-breakpoint
-- Move every existing single attachment into its link table before the columns go.
INSERT INTO "task_candidates" ("task_id", "candidate_id") SELECT "id", "candidate_id" FROM "tasks" WHERE "candidate_id" IS NOT NULL;--> statement-breakpoint
INSERT INTO "task_vacancies" ("task_id", "vacancy_id") SELECT "id", "vacancy_id" FROM "tasks" WHERE "vacancy_id" IS NOT NULL;--> statement-breakpoint
INSERT INTO "task_companies" ("task_id", "company_id") SELECT "id", "company_id" FROM "tasks" WHERE "company_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "candidate_id";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "vacancy_id";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "company_id";