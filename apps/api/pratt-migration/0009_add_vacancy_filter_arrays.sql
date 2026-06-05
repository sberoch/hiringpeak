BEGIN;

ALTER TABLE public.vacancy_filters ADD COLUMN IF NOT EXISTS countries text[];
ALTER TABLE public.vacancy_filters ADD COLUMN IF NOT EXISTS provinces text[];
ALTER TABLE public.vacancy_filters ADD COLUMN IF NOT EXISTS languages text[];

UPDATE public.vacancy_filters SET countries = '{}'::text[] WHERE countries IS NULL;
UPDATE public.vacancy_filters SET provinces = '{}'::text[] WHERE provinces IS NULL;
UPDATE public.vacancy_filters SET languages = '{}'::text[] WHERE languages IS NULL;

COMMIT;
