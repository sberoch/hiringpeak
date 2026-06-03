BEGIN;

ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS organization_id integer;
ALTER TABLE public.blacklists ADD COLUMN IF NOT EXISTS organization_id integer;
ALTER TABLE public.candidate_files ADD COLUMN IF NOT EXISTS organization_id integer;
ALTER TABLE public.candidate_sources ADD COLUMN IF NOT EXISTS organization_id integer;
ALTER TABLE public.candidate_vacancies ADD COLUMN IF NOT EXISTS organization_id integer;
ALTER TABLE public.candidate_vacancy_statuses ADD COLUMN IF NOT EXISTS organization_id integer;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS organization_id integer;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS organization_id integer;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS organization_id integer;
ALTER TABLE public.industries ADD COLUMN IF NOT EXISTS organization_id integer;
ALTER TABLE public.seniorities ADD COLUMN IF NOT EXISTS organization_id integer;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS organization_id integer;
ALTER TABLE public.vacancies ADD COLUMN IF NOT EXISTS organization_id integer;
ALTER TABLE public.vacancy_filters ADD COLUMN IF NOT EXISTS organization_id integer;
ALTER TABLE public.vacancy_statuses ADD COLUMN IF NOT EXISTS organization_id integer;

WITH pratt_org AS (SELECT id FROM public.organizations WHERE name = 'Pratt')
UPDATE public.areas SET organization_id = (SELECT id FROM pratt_org) WHERE organization_id IS NULL;
WITH pratt_org AS (SELECT id FROM public.organizations WHERE name = 'Pratt')
UPDATE public.blacklists SET organization_id = (SELECT id FROM pratt_org) WHERE organization_id IS NULL;
WITH pratt_org AS (SELECT id FROM public.organizations WHERE name = 'Pratt')
UPDATE public.candidate_files SET organization_id = (SELECT id FROM pratt_org) WHERE organization_id IS NULL;
WITH pratt_org AS (SELECT id FROM public.organizations WHERE name = 'Pratt')
UPDATE public.candidate_sources SET organization_id = (SELECT id FROM pratt_org) WHERE organization_id IS NULL;
WITH pratt_org AS (SELECT id FROM public.organizations WHERE name = 'Pratt')
UPDATE public.candidate_vacancies SET organization_id = (SELECT id FROM pratt_org) WHERE organization_id IS NULL;
WITH pratt_org AS (SELECT id FROM public.organizations WHERE name = 'Pratt')
UPDATE public.candidate_vacancy_statuses SET organization_id = (SELECT id FROM pratt_org) WHERE organization_id IS NULL;
WITH pratt_org AS (SELECT id FROM public.organizations WHERE name = 'Pratt')
UPDATE public.candidates SET organization_id = (SELECT id FROM pratt_org) WHERE organization_id IS NULL;
WITH pratt_org AS (SELECT id FROM public.organizations WHERE name = 'Pratt')
UPDATE public.comments SET organization_id = (SELECT id FROM pratt_org) WHERE organization_id IS NULL;
WITH pratt_org AS (SELECT id FROM public.organizations WHERE name = 'Pratt')
UPDATE public.companies SET organization_id = (SELECT id FROM pratt_org) WHERE organization_id IS NULL;
WITH pratt_org AS (SELECT id FROM public.organizations WHERE name = 'Pratt')
UPDATE public.industries SET organization_id = (SELECT id FROM pratt_org) WHERE organization_id IS NULL;
WITH pratt_org AS (SELECT id FROM public.organizations WHERE name = 'Pratt')
UPDATE public.seniorities SET organization_id = (SELECT id FROM pratt_org) WHERE organization_id IS NULL;
WITH pratt_org AS (SELECT id FROM public.organizations WHERE name = 'Pratt')
UPDATE public.users SET organization_id = (SELECT id FROM pratt_org) WHERE organization_id IS NULL;
WITH pratt_org AS (SELECT id FROM public.organizations WHERE name = 'Pratt')
UPDATE public.vacancies SET organization_id = (SELECT id FROM pratt_org) WHERE organization_id IS NULL;
WITH pratt_org AS (SELECT id FROM public.organizations WHERE name = 'Pratt')
UPDATE public.vacancy_filters SET organization_id = (SELECT id FROM pratt_org) WHERE organization_id IS NULL;
WITH pratt_org AS (SELECT id FROM public.organizations WHERE name = 'Pratt')
UPDATE public.vacancy_statuses SET organization_id = (SELECT id FROM pratt_org) WHERE organization_id IS NULL;

ALTER TABLE public.areas ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.blacklists ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.candidate_files ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.candidate_sources ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.candidate_vacancies ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.candidate_vacancy_statuses ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.candidates ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.comments ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.companies ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.industries ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.seniorities ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.vacancies ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.vacancy_filters ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.vacancy_statuses ALTER COLUMN organization_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'areas_organization_id_organizations_id_fk') THEN
    ALTER TABLE public.areas ADD CONSTRAINT areas_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'blacklists_organization_id_organizations_id_fk') THEN
    ALTER TABLE public.blacklists ADD CONSTRAINT blacklists_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'candidate_files_organization_id_organizations_id_fk') THEN
    ALTER TABLE public.candidate_files ADD CONSTRAINT candidate_files_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'candidate_sources_organization_id_organizations_id_fk') THEN
    ALTER TABLE public.candidate_sources ADD CONSTRAINT candidate_sources_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'candidate_vacancies_organization_id_organizations_id_fk') THEN
    ALTER TABLE public.candidate_vacancies ADD CONSTRAINT candidate_vacancies_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'candidate_vacancy_statuses_organization_id_organizations_id_fk') THEN
    ALTER TABLE public.candidate_vacancy_statuses ADD CONSTRAINT candidate_vacancy_statuses_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'candidates_organization_id_organizations_id_fk') THEN
    ALTER TABLE public.candidates ADD CONSTRAINT candidates_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'comments_organization_id_organizations_id_fk') THEN
    ALTER TABLE public.comments ADD CONSTRAINT comments_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_organization_id_organizations_id_fk') THEN
    ALTER TABLE public.companies ADD CONSTRAINT companies_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'industries_organization_id_organizations_id_fk') THEN
    ALTER TABLE public.industries ADD CONSTRAINT industries_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seniorities_organization_id_organizations_id_fk') THEN
    ALTER TABLE public.seniorities ADD CONSTRAINT seniorities_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_organization_id_organizations_id_fk') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE restrict;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vacancies_organization_id_organizations_id_fk') THEN
    ALTER TABLE public.vacancies ADD CONSTRAINT vacancies_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vacancy_filters_organization_id_organizations_id_fk') THEN
    ALTER TABLE public.vacancy_filters ADD CONSTRAINT vacancy_filters_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vacancy_statuses_organization_id_organizations_id_fk') THEN
    ALTER TABLE public.vacancy_statuses ADD CONSTRAINT vacancy_statuses_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE cascade;
  END IF;
END $$;

COMMIT;
