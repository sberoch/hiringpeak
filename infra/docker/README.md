# Production deploy

Single-VPS Docker Compose setup. Images are built in GitHub Actions and
pushed to GitHub Container Registry (GHCR); the VPS only pulls and runs.
Nginx on the host terminates TLS and routes subdomains to the four services
bound on `127.0.0.1`:

| Service    | Host port | Subdomain                   |
| ---------- | --------- | --------------------------- |
| web        | 5000      | `app.hiringpeak.com`        |
| landing    | 5001      | `hiringpeak.com`            |
| backoffice | 5002      | `backoffice.hiringpeak.com` |
| api        | 5003      | `api.hiringpeak.com`        |

Images live at:

- `ghcr.io/sberoch/hiringpeak-api`
- `ghcr.io/sberoch/hiringpeak-web`
- `ghcr.io/sberoch/hiringpeak-backoffice`
- `ghcr.io/sberoch/hiringpeak-landing`

Each image carries two tags on every successful build: `latest` and
`sha-<short-commit>`. The VPS pulls `latest` by default; pin a specific SHA
via `*_IMAGE_TAG` env vars (see [Rollback](#rollback)).

## First-time VPS setup

1. Install Docker + Docker Compose plugin.
2. Clone the repo to the deploy directory (e.g. `/srv/hiringpeak`).
3. Copy env template and fill in real values:
   ```
   cp infra/docker/.env.production.example infra/docker/.env.production
   $EDITOR infra/docker/.env.production
   ```
4. Configure nginx on the host with server blocks for the four subdomains,
   each proxying to its corresponding `127.0.0.1:<port>` and forwarding
   `X-Forwarded-Proto: https`.
5. Log the VPS into GHCR so it can pull private images. Create a classic
   GitHub PAT with only `read:packages` scope (https://github.com/settings/tokens),
   then on the VPS:
   ```
   echo '<PAT>' | docker login ghcr.io -u sberoch --password-stdin
   ```
   Docker stores the credentials in `~/.docker/config.json`; this survives
   reboots. Rotate the PAT yearly.
6. Add GitHub repo secrets for the deploy workflow:
   `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_APP_DIR`, plus every
   `NEXT_PUBLIC_*` variable from `.env.production` (used as build-args when
   CI builds the `web` and `backoffice` images). Upload in one shot:
   ```
   gh secret set -f infra/docker/.env.production --repo sberoch/hiringpeak
   ```

## First deploy

```
docker compose --env-file infra/docker/.env.production \
  -f infra/docker/docker-compose.yml pull

docker compose --env-file infra/docker/.env.production \
  -f infra/docker/docker-compose.yml up -d
```

This pulls the four images from GHCR, runs `api-migrate` (applies drizzle
migrations), then starts `api`, `web`, `backoffice`, `landing` in dependency
order.

## Bootstrap the database (run once, ever)

After the first `up`, seed the organization, permissions, roles, admin user,
and catalogs:

```
docker compose --env-file infra/docker/.env.production \
  -f infra/docker/docker-compose.yml exec \
  -e ADMIN_EMAIL=admin@hiringpeak.com \
  -e ADMIN_PASSWORD='12345678' \
  -e ORG_NAME='Pratt' \
  api node dist/src/common/database/seed-prod-init.js
```

The seed is idempotent, but there is no reason to run it again.

## Subsequent deploys

Push to `main` — `.github/workflows/deploy.yml` runs three jobs:

1. **test** — typechecks and builds the monorepo with pnpm/turbo.
2. **build** — matrix job: in parallel, builds each of the four Dockerfiles
   and pushes to GHCR tagged `latest` and `sha-<commit>`. Uses the GitHub
   Actions cache for layer caching.
3. **deploy** — SSHes into the VPS and runs:
   ```
   git pull --ff-only origin main
   docker compose --env-file infra/docker/.env.production \
     -f infra/docker/docker-compose.yml pull
   docker compose --env-file infra/docker/.env.production \
     -f infra/docker/docker-compose.yml up -d
   docker image prune -a -f --filter "until=168h"
   ```

Migrations run automatically via the `api-migrate` one-shot service before
the API restarts.

PRs run `test` only; they don't build or push images.

## Rollback

Every successful build leaves a SHA-tagged image in GHCR. To pin the stack
to an earlier build without rebuilding anything, edit
`infra/docker/.env.production` on the VPS:

```
API_IMAGE_TAG=sha-abc1234
WEB_IMAGE_TAG=sha-abc1234
BACKOFFICE_IMAGE_TAG=sha-abc1234
LANDING_IMAGE_TAG=sha-abc1234
```

Then:

```
docker compose --env-file infra/docker/.env.production \
  -f infra/docker/docker-compose.yml pull

docker compose --env-file infra/docker/.env.production \
  -f infra/docker/docker-compose.yml up -d
```

To return to rolling `latest`, remove those lines (or set them to `latest`)
and run `up -d` again.

## Operations

Inspect stack:

```
docker compose --env-file infra/docker/.env.production \
  -f infra/docker/docker-compose.yml ps
```

Tail logs:

```
docker compose --env-file infra/docker/.env.production \
  -f infra/docker/docker-compose.yml logs -f api
```

Stop everything:

```
docker compose --env-file infra/docker/.env.production \
  -f infra/docker/docker-compose.yml down
```

## Notes

- `infra/docker/.env.production` is gitignored — manage it out-of-band (copy
  over SSH, or seed from a secret manager). CI builds use GitHub repo
  secrets for `NEXT_PUBLIC_*` values; the VPS still needs the full file for
  runtime.
- Postgres data lives in the `hiringpeak-prod_pgdata` named volume. Back it
  up before destructive operations (`docker volume rm` is irreversible).
- Only postgres is persistent; all four app services are stateless and safe
  to rebuild/replace at any time.
- The compose file has no `build:` sections — images come exclusively from
  GHCR. To reproduce a prod build locally for debugging, copy the
  `docker buildx build` command from `.github/workflows/deploy.yml`.
