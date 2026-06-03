BEGIN;

CREATE TABLE IF NOT EXISTS public.rejection_reasons (
  id serial PRIMARY KEY,
  name text NOT NULL,
  sort integer NOT NULL,
  organization_id integer NOT NULL REFERENCES public.organizations(id) ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id serial PRIMARY KEY,
  title text NOT NULL,
  due_date date,
  completed boolean DEFAULT false NOT NULL,
  completed_at timestamp,
  completed_by integer REFERENCES public.users(id) ON DELETE set null,
  created_by integer NOT NULL REFERENCES public.users(id),
  assigned_to integer NOT NULL REFERENCES public.users(id),
  organization_id integer NOT NULL REFERENCES public.organizations(id) ON DELETE cascade,
  candidate_id integer REFERENCES public.candidates(id) ON DELETE cascade,
  vacancy_id integer REFERENCES public.vacancies(id) ON DELETE cascade,
  company_id integer REFERENCES public.companies(id) ON DELETE cascade,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id serial PRIMARY KEY,
  recipient_user_id integer NOT NULL REFERENCES public.users(id) ON DELETE cascade,
  organization_id integer NOT NULL REFERENCES public.organizations(id) ON DELETE cascade,
  kind text NOT NULL,
  task_id integer NOT NULL REFERENCES public.tasks(id) ON DELETE cascade,
  read_at timestamp,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.audit_events (
  id serial PRIMARY KEY,
  event_type text NOT NULL,
  organization_id integer NOT NULL REFERENCES public.organizations(id) ON DELETE restrict,
  actor_user_id integer NOT NULL REFERENCES public.users(id) ON DELETE restrict,
  entity_type text NOT NULL,
  entity_id integer,
  metadata jsonb,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ai_vacancy_runs (
  id serial PRIMARY KEY,
  public_token text NOT NULL,
  organization_id integer NOT NULL REFERENCES public.organizations(id) ON DELETE cascade,
  user_id integer NOT NULL REFERENCES public.users(id) ON DELETE cascade,
  prompt text NOT NULL,
  source_type text DEFAULT 'prompt' NOT NULL,
  user_prompt text,
  model text NOT NULL,
  status text NOT NULL,
  response_text text,
  draft jsonb,
  extraction_metadata jsonb,
  total_usage jsonb,
  error_message text,
  latency_ms integer NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_vacancy_runs_public_token_unique
  ON public.ai_vacancy_runs (public_token);

CREATE TABLE IF NOT EXISTS public.ai_vacancy_run_events (
  id serial PRIMARY KEY,
  run_id integer NOT NULL REFERENCES public.ai_vacancy_runs(id) ON DELETE cascade,
  type text NOT NULL,
  payload jsonb,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ai_vacancy_run_documents (
  id serial PRIMARY KEY,
  run_id integer NOT NULL REFERENCES public.ai_vacancy_runs(id) ON DELETE cascade,
  organization_id integer NOT NULL REFERENCES public.organizations(id) ON DELETE cascade,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

WITH pratt_org AS (
  SELECT id
  FROM public.organizations
  WHERE name = 'Pratt'
)
INSERT INTO public.rejection_reasons (name, sort, organization_id)
SELECT 'Otro', 999, id
FROM pratt_org
WHERE NOT EXISTS (
  SELECT 1
  FROM public.rejection_reasons rr
  WHERE rr.organization_id = pratt_org.id
    AND rr.name = 'Otro'
);

COMMIT;
