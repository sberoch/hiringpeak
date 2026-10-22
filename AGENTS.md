# HiringPeak

- Vocabulary: `GLOSSARY.md`.
- Writing code: `CODING_STANDARDS.md`.
- Writing tests: `docs/agents/testing.md`.
- Exploring a domain area: `docs/agents/domain.md`.

## Gotchas

- `apps/api` imports `packages/shared` from its built `dist`: after editing shared, run `pnpm --filter @workspace/shared build` before api tests or typecheck. `apps/web` reads shared's source.
- Import shared by file subpath (`@workspace/shared/lib/<file>`); the `lib` index doesn't exist.
- Data-only migration (e.g. new permissions): `cd apps/api && pnpm exec drizzle-kit generate --custom --name <name>`, then hand-write the SQL.
