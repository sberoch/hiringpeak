---
status: accepted
---

# Pratt-to-HiringPeak migration uses raw SQL scripts, not drizzle-kit

HiringPeak evolved from Pratt (a single-tenant custom project) into a multi-tenant SaaS. We need to migrate Pratt's production data into the new schema shape via a sequence of raw `.sql` files run with `psql -f`, not drizzle-kit migrations. The migration is one-time and irreversible — once Pratt data is reshaped, there's no going back. Raw SQL gives us full control over complex data transformations (enum swaps, array conversions, role mapping, conditional backfills) that drizzle-kit's declarative diff can't express.

## Considered Options

- **Raw SQL scripts (chosen)** — full control, reviewable line-by-line, no framework dependency, handles data migrations alongside schema changes.
- **drizzle-kit generate** — declarative diff only; can't express data migrations (role mapping, enum value transforms, array conversions from scalar columns). Would require a separate data migration layer anyway.
- **Hybrid (drizzle for schema + raw SQL for data)** — two systems to coordinate, ordering dependencies between them, harder to reason about as a single atomic migration.

## Consequences

- **11 migration files, 7 phases.** Foundation (orgs, RBAC, new domain tables) → org_id backfill → auth transform → company enum → candidate evolution → vacancy/pipeline → cleanup. Each file is self-contained and can be re-run on a fresh dump.
- **Organization ID uses a CTE variable, not a hardcoded number.** The Pratt org is created via `INSERT ... RETURNING id INTO v_org_id` and all backfills reference the variable. Avoids collision with existing debug orgs in production.
- **Role mapping is lossy by design.** Old `ADMIN` → Administrador, old `BASIC` → Basic. Manager is seeded empty. No existing user gets Manager on migration — that's a post-migration UI action.
- **`isInCompanyViaPratt` data is preserved in `short_description` and retained for the current app schema.** Appends "Colocado vía Pratt" to the free-text field and normalizes nulls to `false`. CONTEXT.md flags the column as a Pratt-specific leak to remove, but the current API/UI still read and write it, so dropping it is deferred until the application contract changes.
- **Pipeline flags use conservative heuristics.** `isInitial` = sort 1, `isRejection` = sort 2, highest sort = placed (no flag). Existing rejected candidacies get `rejection_reason_id` = seeded "Otro". All flagged as post-migration UI corrections.
- **`closed_at` left null for all existing vacancies.** Recruiters backfill via the close/reopen action, which is audited on its own axis per ADR-0002.
- **`document_number` migrated to `short_description` then dropped.** Same preservation-over-loss principle as `isInCompanyViaPratt`.
- **`country` scalar → `countries[]` array.** Existing `'Argentina'` becomes `ARRAY['Argentina']`. `provinces[]` and `languages[]` start empty.
