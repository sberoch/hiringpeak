INSERT INTO "permissions" ("code", "label", "description")
VALUES
  ('ORGANIZATION_MANAGE', 'Gestionar organización', 'Configurar el branding de la organización (logo)')
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r.id, p.id
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r.name = 'Administrador'
  AND p.code = 'ORGANIZATION_MANAGE'
ON CONFLICT DO NOTHING;
