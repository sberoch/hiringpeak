# Production deploy

Single-VPS Docker Compose setup. Nginx on the host terminates TLS and routes
subdomains to the four services bound on `127.0.0.1`:

| Service    | Host port | Subdomain                   |
| ---------- | --------- | --------------------------- |
| web        | 5000      | `app.hiringpeak.com`        |
| landing    | 5001      | `hiringpeak.com`            |
| backoffice | 5002      | `backoffice.hiringpeak.com` |
| api        | 5003      | `api.hiringpeak.com`        |

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
5. Add GitHub repo secrets for the deploy workflow:
   `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_APP_DIR`.

## First deploy

```
docker compose --env-file infra/docker/.env.production \
  -f infra/docker/docker-compose.yml up -d --build
```

This builds the four images, runs `api-migrate` (applies drizzle migrations),
then starts `api`, `web`, `backoffice`, `landing` in dependency order.

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

Push to `main` — `.github/workflows/deploy.yml` SSHes into the VPS and runs:

```
git pull --ff-only origin main
docker compose --env-file infra/docker/.env.production \
  -f infra/docker/docker-compose.yml up -d --build
```

Migrations run automatically via the `api-migrate` one-shot service before
the API restarts.

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

Rollback:

```
git checkout <previous-sha>
docker compose --env-file infra/docker/.env.production \
  -f infra/docker/docker-compose.yml up -d --build
```

Stop everything:

```
docker compose --env-file infra/docker/.env.production \
  -f infra/docker/docker-compose.yml down
```

## Notes

- `infra/docker/.env.production` is gitignored — manage it out-of-band (copy
  over SSH, or seed from a secret manager).
- Postgres data lives in the `hiringpeak-prod_pgdata` named volume. Back it
  up before destructive operations (`docker volume rm` is irreversible).
- Only postgres is persistent; all four app services are stateless and safe
  to rebuild/replace at any time.
