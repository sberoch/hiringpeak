CREATE INDEX "candidate_vacancies_vacancy_id_idx" ON "candidate_vacancies" USING btree ("vacancy_id");--> statement-breakpoint
CREATE INDEX "candidate_vacancies_candidate_id_idx" ON "candidate_vacancies" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "vacancies_organization_id_idx" ON "vacancies" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "vacancies_status_id_idx" ON "vacancies" USING btree ("status_id");--> statement-breakpoint
CREATE INDEX "vacancies_company_id_idx" ON "vacancies" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "vacancies_vacancy_filters_id_idx" ON "vacancies" USING btree ("vacancy_filters_id");--> statement-breakpoint
CREATE INDEX "vacancies_created_at_idx" ON "vacancies" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "vacancy_filters_areas_filters_id_idx" ON "vacancy_filters_areas" USING btree ("vacancy_filters_id");--> statement-breakpoint
CREATE INDEX "vacancy_filters_areas_area_id_idx" ON "vacancy_filters_areas" USING btree ("area_id");--> statement-breakpoint
CREATE INDEX "vacancy_filters_industries_filters_id_idx" ON "vacancy_filters_industries" USING btree ("vacancy_filters_id");--> statement-breakpoint
CREATE INDEX "vacancy_filters_industries_industry_id_idx" ON "vacancy_filters_industries" USING btree ("industry_id");--> statement-breakpoint
CREATE INDEX "vacancy_filters_seniorities_filters_id_idx" ON "vacancy_filters_seniorities" USING btree ("vacancy_filters_id");--> statement-breakpoint
CREATE INDEX "vacancy_filters_seniorities_seniority_id_idx" ON "vacancy_filters_seniorities" USING btree ("seniority_id");