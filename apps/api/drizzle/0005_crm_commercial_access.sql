INSERT INTO "permissions" ("code", "label", "description")
VALUES
  ('CRM_READ', 'Ver área comercial', 'Ver oportunidades, contactos, interacciones y tareas comerciales'),
  ('CRM_MANAGE', 'Gestionar área comercial', 'Crear, editar y eliminar oportunidades, contactos e interacciones, y configurar el área comercial')
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r.name IN ('Administrador', 'Manager')
  AND p.code IN ('CRM_READ', 'CRM_MANAGE')
ON CONFLICT DO NOTHING;
