# Pratt-to-HiringPeak migration

Run these files after restoring the Pratt custom-format dump into an empty
PostgreSQL database:

```sh
pg_restore -d "$DATABASE_URL" dump-pratt.sql
for f in project/apps/api/pratt-migration/*.sql; do
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done
```

The scripts are intentionally separate from the normal Drizzle migrations. They
reshape the restored Pratt database into the current HiringPeak schema and seed
the Pratt organization, RBAC tables, rejection reason fallback, and new domain
tables needed by the app.

Notes:

- `users.role` is consumed before being dropped, so run `0005` only after `0002`
  and `0004`.
- `is_in_company_via_pratt` is retained because the current API/UI still use it;
  true rows also get "Colocado vía Pratt" appended to `short_description`.
- Existing vacancies keep `closed_at = null`; recruiters backfill through the
  audited close/reopen product flow.

## Resetting migrated user passwords

The current app does not use Better Auth; login uses the `users.password`
column with the shared `hashPassword` bcrypt helper. After migrating Pratt, use
the API utility script to set fresh passwords without changing user ids, emails,
names, roles, or organization links:

```sh
cd project/apps/api
RESET_ORG_NAME=Pratt \
CONFIRM_RESET_USER_PASSWORDS=yes \
pnpm run db:reset-user-passwords
```

By default, the script generates one random password per matched user and prints
the temporary credentials once. You can instead set one shared password:

```sh
RESET_ORG_NAME=Pratt \
RESET_SHARED_PASSWORD='FreshPassword123+' \
CONFIRM_RESET_USER_PASSWORDS=yes \
pnpm run db:reset-user-passwords
```

Or target specific users:

```sh
RESET_USER_EMAILS='ec@pratt.com.ar,sp@pratt.com.ar' \
CONFIRM_RESET_USER_PASSWORDS=yes \
pnpm run db:reset-user-passwords
```
