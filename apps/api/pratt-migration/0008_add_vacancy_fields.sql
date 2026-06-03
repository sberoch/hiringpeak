BEGIN;

ALTER TABLE public.vacancies ADD COLUMN IF NOT EXISTS salary text;
ALTER TABLE public.vacancies ADD COLUMN IF NOT EXISTS closed_at timestamp;
ALTER TABLE public.vacancies ADD COLUMN IF NOT EXISTS ai_vacancy_run_id integer;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vacancies_ai_vacancy_run_id_ai_vacancy_runs_id_fk') THEN
    ALTER TABLE public.vacancies ADD CONSTRAINT vacancies_ai_vacancy_run_id_ai_vacancy_runs_id_fk
      FOREIGN KEY (ai_vacancy_run_id) REFERENCES public.ai_vacancy_runs(id) ON DELETE set null;
  END IF;
END $$;

-- Existing Pratt vacancies have no audited close/reopen history. Recruiters
-- backfill closed_at through the product flow after migration.
UPDATE public.vacancies SET closed_at = NULL;

COMMIT;
