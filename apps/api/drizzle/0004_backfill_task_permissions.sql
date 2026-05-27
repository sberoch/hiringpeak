-- Custom SQL migration file, put your code below! --

-- Backfill: TASK_READ + TASK_MANAGE for existing tenants' default roles.
-- `findOrCreateRole` in the seed script is role-level idempotent and will not
-- attach new permissions to already-existing roles, so this backfill is
-- required to avoid the feature being dark for established customers.

-- Ensure the two new permission rows exist globally (idempotent).
INSERT INTO "permissions" ("code", "label", "description")
VALUES ('TASK_READ', 'Ver tareas', 'Ver listado y detalle de tareas')
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "permissions" ("code", "label", "description")
VALUES ('TASK_MANAGE', 'Gestionar tareas', 'Crear, editar, completar, reasignar y eliminar tareas')
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint

-- Administrador + Manager → TASK_READ + TASK_MANAGE
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."name" IN ('Administrador', 'Manager')
  AND p."code" IN ('TASK_READ', 'TASK_MANAGE')
ON CONFLICT DO NOTHING;
--> statement-breakpoint

-- Basic → TASK_READ
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."name" = 'Basic'
  AND p."code" = 'TASK_READ'
ON CONFLICT DO NOTHING;
