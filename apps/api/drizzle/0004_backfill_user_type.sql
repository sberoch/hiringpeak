-- Set INTERNAL_USER for existing system admins (no org)
UPDATE "users" SET "user_type" = 'INTERNAL_USER' WHERE "role"::text = 'SYSTEM_ADMIN';
