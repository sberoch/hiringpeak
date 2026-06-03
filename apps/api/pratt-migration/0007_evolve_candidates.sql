BEGIN;

ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS countries text[] DEFAULT '{}'::text[];
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS provinces text[] DEFAULT '{}'::text[];
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}'::text[];
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now() NOT NULL;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now() NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'candidates'
      AND column_name = 'is_in_company_via_pratt'
  ) THEN
    UPDATE public.candidates
    SET short_description = concat_ws(E'\n', NULLIF(short_description, ''), 'Colocado vía Pratt')
    WHERE is_in_company_via_pratt IS TRUE
      AND coalesce(short_description, '') NOT LIKE '%Colocado vía Pratt%';

    UPDATE public.candidates
    SET is_in_company_via_pratt = false
    WHERE is_in_company_via_pratt IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'candidates'
      AND column_name = 'document_number'
  ) THEN
    UPDATE public.candidates
    SET short_description = concat_ws(E'\n', NULLIF(short_description, ''), 'Documento: ' || document_number)
    WHERE document_number IS NOT NULL
      AND document_number <> ''
      AND coalesce(short_description, '') NOT LIKE '%Documento: ' || document_number || '%';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'candidates'
      AND column_name = 'country'
  ) THEN
    UPDATE public.candidates
    SET countries = ARRAY[country]
    WHERE country IS NOT NULL
      AND (countries IS NULL OR cardinality(countries) = 0);
  END IF;
END $$;

UPDATE public.candidates SET countries = '{}'::text[] WHERE countries IS NULL;
UPDATE public.candidates SET provinces = '{}'::text[] WHERE provinces IS NULL;
UPDATE public.candidates SET languages = '{}'::text[] WHERE languages IS NULL;

ALTER TABLE public.candidates DROP COLUMN IF EXISTS document_number;
ALTER TABLE public.candidates DROP COLUMN IF EXISTS country;

ALTER TABLE public.candidates DROP CONSTRAINT IF EXISTS candidates_name_unique;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'candidates_name_organization_id_unique') THEN
    ALTER TABLE public.candidates ADD CONSTRAINT candidates_name_organization_id_unique UNIQUE (name, organization_id);
  END IF;
END $$;

COMMIT;
