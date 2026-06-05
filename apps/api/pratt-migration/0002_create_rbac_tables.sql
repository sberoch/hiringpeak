BEGIN;

CREATE TABLE IF NOT EXISTS public.permissions (
  id serial PRIMARY KEY,
  code text NOT NULL,
  label text NOT NULL,
  description text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  CONSTRAINT permissions_code_unique UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS public.roles (
  id serial PRIMARY KEY,
  organization_id integer REFERENCES public.organizations(id) ON DELETE cascade,
  name text NOT NULL,
  is_system boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id integer NOT NULL REFERENCES public.roles(id) ON DELETE cascade,
  permission_id integer NOT NULL REFERENCES public.permissions(id) ON DELETE cascade,
  CONSTRAINT role_permissions_role_id_permission_id_pk PRIMARY KEY (role_id, permission_id)
);

INSERT INTO public.permissions (code, label, description)
VALUES
  ('CANDIDATE_READ', 'Ver postulantes', 'Permite ver listado y detalle de postulantes'),
  ('CANDIDATE_MANAGE', 'Gestionar postulantes', 'Crear, editar y eliminar postulantes'),
  ('VACANCY_READ', 'Ver vacantes', 'Permite ver listado y detalle de vacantes'),
  ('VACANCY_MANAGE', 'Gestionar vacantes', 'Crear, editar y eliminar vacantes'),
  ('USER_READ', 'Ver usuarios', 'Ver usuarios de la organización'),
  ('USER_MANAGE', 'Gestionar usuarios', 'Crear y editar usuarios'),
  ('ROLE_MANAGE', 'Gestionar roles', 'Crear y asignar roles y permisos'),
  ('COMPANY_READ', 'Ver empresas', 'Ver empresas'),
  ('COMPANY_MANAGE', 'Gestionar empresas', 'Crear y editar empresas'),
  ('AREA_READ', 'Ver áreas', 'Ver áreas'),
  ('AREA_MANAGE', 'Gestionar áreas', 'Crear y editar áreas'),
  ('SETTINGS_READ', 'Ver configuración', 'Ver configuración de la organización'),
  ('SETTINGS_MANAGE', 'Gestionar configuración', 'Modificar configuración'),
  ('AUDIT_LOG_READ', 'Ver auditoría', 'Ver registro de auditoría'),
  ('TASK_READ', 'Ver tareas propias', 'Ver tareas asignadas al usuario'),
  ('TASK_READ_ALL', 'Ver todas las tareas', 'Ver tareas de todos los usuarios de la organización'),
  ('TASK_MANAGE', 'Gestionar tareas propias', 'Crear, editar, completar y eliminar tareas propias'),
  ('TASK_MANAGE_ALL', 'Gestionar todas las tareas', 'Crear, editar, completar, reasignar y eliminar tareas de cualquier usuario')
ON CONFLICT (code) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description,
    updated_at = now();

WITH pratt_org AS (
  SELECT id
  FROM public.organizations
  WHERE name = 'Pratt'
),
role_seed AS (
  SELECT pratt_org.id AS organization_id, role_name
  FROM pratt_org
  CROSS JOIN (VALUES ('Administrador'), ('Manager'), ('Basic')) AS seed(role_name)
)
INSERT INTO public.roles (organization_id, name)
SELECT organization_id, role_name
FROM role_seed
WHERE NOT EXISTS (
  SELECT 1
  FROM public.roles r
  WHERE r.organization_id = role_seed.organization_id
    AND r.name = role_seed.role_name
);

WITH role_codes(role_name, code) AS (
  VALUES
    ('Administrador', 'CANDIDATE_READ'),
    ('Administrador', 'CANDIDATE_MANAGE'),
    ('Administrador', 'VACANCY_READ'),
    ('Administrador', 'VACANCY_MANAGE'),
    ('Administrador', 'USER_READ'),
    ('Administrador', 'USER_MANAGE'),
    ('Administrador', 'ROLE_MANAGE'),
    ('Administrador', 'COMPANY_READ'),
    ('Administrador', 'COMPANY_MANAGE'),
    ('Administrador', 'AREA_READ'),
    ('Administrador', 'AREA_MANAGE'),
    ('Administrador', 'SETTINGS_READ'),
    ('Administrador', 'SETTINGS_MANAGE'),
    ('Administrador', 'AUDIT_LOG_READ'),
    ('Administrador', 'TASK_READ'),
    ('Administrador', 'TASK_READ_ALL'),
    ('Administrador', 'TASK_MANAGE'),
    ('Administrador', 'TASK_MANAGE_ALL'),
    ('Manager', 'CANDIDATE_READ'),
    ('Manager', 'CANDIDATE_MANAGE'),
    ('Manager', 'VACANCY_READ'),
    ('Manager', 'VACANCY_MANAGE'),
    ('Manager', 'USER_READ'),
    ('Manager', 'USER_MANAGE'),
    ('Manager', 'COMPANY_READ'),
    ('Manager', 'COMPANY_MANAGE'),
    ('Manager', 'AREA_READ'),
    ('Manager', 'AREA_MANAGE'),
    ('Manager', 'SETTINGS_READ'),
    ('Manager', 'SETTINGS_MANAGE'),
    ('Manager', 'AUDIT_LOG_READ'),
    ('Manager', 'TASK_READ'),
    ('Manager', 'TASK_READ_ALL'),
    ('Manager', 'TASK_MANAGE'),
    ('Manager', 'TASK_MANAGE_ALL'),
    ('Basic', 'CANDIDATE_READ'),
    ('Basic', 'VACANCY_READ'),
    ('Basic', 'USER_READ'),
    ('Basic', 'COMPANY_READ'),
    ('Basic', 'AREA_READ'),
    ('Basic', 'SETTINGS_READ'),
    ('Basic', 'TASK_READ'),
    ('Basic', 'TASK_MANAGE')
),
pratt_org AS (
  SELECT id
  FROM public.organizations
  WHERE name = 'Pratt'
)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM pratt_org
JOIN public.roles r ON r.organization_id = pratt_org.id
JOIN role_codes rc ON rc.role_name = r.name
JOIN public.permissions p ON p.code = rc.code
ON CONFLICT DO NOTHING;

COMMIT;
