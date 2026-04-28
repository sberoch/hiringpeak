# Testing

## Runner

Vitest, configured per package. One `vitest.config.ts` in each package that has tests.

- `apps/api` — `node` env, `unplugin-swc` for NestJS decorator metadata, includes `src/**/*.{test,spec}.ts`.
- `apps/web` — `jsdom` env, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/jest-dom` (loaded in `vitest.setup.ts`). Tests live next to the code under `app|components|lib|hooks|contexts|providers`.
- `packages/shared` — `node` env.

Globals are enabled in all configs (`describe`, `it`, `expect`, `beforeEach`, `vi`) and registered in each package's `tsconfig.json` via `"types": [..., "vitest/globals"]`. New specs do not need to import these.

## Commands

- `pnpm test` — run every package's tests via turbo.
- `pnpm --filter <pkg> test` — single package.
- `pnpm --filter <pkg> test:watch` — watch mode for the package you're iterating on.
- `pnpm --filter api test:cov` — coverage report.

`web` and `shared` have `passWithNoTests: true` so the turbo pipeline is green when a package has no specs yet.

## Style

The `tdd` skill in `~/.claude/skills/tdd` (Matt Pocock's red-green-refactor) is the source of truth for how we write tests in this repo. Invoke it when building a feature or fixing a bug test-first.

The short version, so you don't drift:

- **Vertical slices, not horizontal.** One test → one implementation → repeat. Don't write all tests up front.
- **Behaviour through public interfaces.** Tests should survive an internal refactor that doesn't change behaviour.
- **No mocking internal collaborators.** Mocks are for true boundaries (HTTP, DB driver, clock). If you find yourself mocking a service you own to test another service you own, the seam is in the wrong place.
- **Don't verify through side channels.** Reading the database to confirm `createUser` worked is a bad test; calling `getUser` is a good one.
- **One logical assertion per test**, named after the behaviour ("user can checkout with valid cart"), not the implementation ("calls paymentService.process").

See `~/.claude/skills/tdd/SKILL.md`, `tests.md`, `mocking.md`, `interface-design.md`, `deep-modules.md`, `refactoring.md` for the full set.
