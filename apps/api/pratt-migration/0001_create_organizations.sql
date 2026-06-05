BEGIN;

CREATE TABLE IF NOT EXISTS public.organizations (
  id serial PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

INSERT INTO public.organizations (name)
SELECT 'Pratt'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.organizations
  WHERE name = 'Pratt'
);

COMMIT;
