BEGIN;

ALTER TABLE public.vacancy_statuses ADD COLUMN IF NOT EXISTS is_final boolean DEFAULT false NOT NULL;
ALTER TABLE public.candidate_vacancy_statuses ADD COLUMN IF NOT EXISTS is_rejection boolean DEFAULT false NOT NULL;
ALTER TABLE public.candidate_vacancies ADD COLUMN IF NOT EXISTS rejection_reason_id integer;
ALTER TABLE public.candidate_vacancies ADD COLUMN IF NOT EXISTS rejection_note text;

UPDATE public.vacancy_statuses
SET is_final = lower(name) LIKE '%cubiert%'
  OR lower(name) LIKE '%cancel%'
  OR lower(name) LIKE '%cerrad%'
  OR lower(name) LIKE '%final%';

UPDATE public.candidate_vacancy_statuses
SET is_initial = sort = 1,
    is_rejection = sort = 2;

WITH rejection_statuses AS (
  SELECT id, organization_id
  FROM public.candidate_vacancy_statuses
  WHERE is_rejection IS TRUE
),
fallback_reasons AS (
  SELECT DISTINCT ON (organization_id) id, organization_id
  FROM public.rejection_reasons
  WHERE name = 'Otro'
  ORDER BY organization_id, sort, id
)
UPDATE public.candidate_vacancies cv
SET rejection_reason_id = fallback_reasons.id
FROM rejection_statuses
JOIN fallback_reasons ON fallback_reasons.organization_id = rejection_statuses.organization_id
WHERE cv.candidate_vacancy_status_id = rejection_statuses.id
  AND cv.rejection_reason_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'candidate_vacancies_rejection_reason_id_rejection_reasons_id_fk') THEN
    ALTER TABLE public.candidate_vacancies ADD CONSTRAINT candidate_vacancies_rejection_reason_id_rejection_reasons_id_fk
      FOREIGN KEY (rejection_reason_id) REFERENCES public.rejection_reasons(id) ON DELETE restrict;
  END IF;
END $$;

COMMIT;
