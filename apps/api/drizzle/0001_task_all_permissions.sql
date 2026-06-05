INSERT INTO "permissions" ("code", "label", "description")
VALUES
  ('TASK_READ', 'Ver tareas propias', 'Ver tareas asignadas al usuario'),
  ('TASK_READ_ALL', 'Ver todas las tareas', 'Ver tareas de todos los usuarios de la organización'),
  ('TASK_MANAGE', 'Gestionar tareas propias', 'Crear, editar, completar y eliminar tareas propias'),
  ('TASK_MANAGE_ALL', 'Gestionar todas las tareas', 'Crear, editar, completar, reasignar y eliminar tareas de cualquier usuario')
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r.name IN ('Administrador', 'Manager')
  AND p.code IN ('TASK_READ', 'TASK_READ_ALL', 'TASK_MANAGE', 'TASK_MANAGE_ALL')
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r.name = 'Basic'
  AND p.code IN ('TASK_READ', 'TASK_MANAGE')
ON CONFLICT DO NOTHING;
