BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
    CREATE TYPE public.user_type AS ENUM ('END_USER', 'INTERNAL_USER');
  END IF;
END $$;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_type public.user_type DEFAULT 'END_USER' NOT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role_id integer;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'role'
  ) THEN
    UPDATE public.users u
    SET role_id = r.id
    FROM public.roles r
    WHERE r.organization_id = u.organization_id
      AND r.name = CASE u.role::text
        WHEN 'ADMIN' THEN 'Administrador'
        WHEN 'MANAGER' THEN 'Manager'
        ELSE 'Basic'
      END
      AND u.role_id IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_id_roles_id_fk') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE set null;
  END IF;
END $$;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_unique;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_organization_id_unique') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_email_organization_id_unique UNIQUE (email, organization_id);
  END IF;
END $$;

ALTER TABLE public.users DROP COLUMN IF EXISTS role;

COMMIT;
