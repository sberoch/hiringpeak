BEGIN;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS client_email text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS client_phone text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'companyStatus') THEN
    CREATE TYPE public."companyStatus" AS ENUM ('Active', 'Prospect');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_type t ON t.oid = a.atttypid
    WHERE n.nspname = 'public'
      AND c.relname = 'companies'
      AND a.attname = 'status'
      AND t.typname = 'movementStatus'
  ) THEN
    ALTER TABLE public.companies
      ALTER COLUMN status TYPE public."companyStatus"
      USING CASE status::text
        WHEN 'Activo' THEN 'Active'::public."companyStatus"
        ELSE 'Prospect'::public."companyStatus"
      END;
  END IF;
END $$;

COMMIT;
