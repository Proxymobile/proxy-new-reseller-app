# DEPLOY.md

> VPS setup, Docker Compose, deployment workflow.

## Current Production

| Item | Value |
|------|-------|
| Server | 72.62.117.94 (Hetzner) |
| OS | Ubuntu 24.04 LTS |
| Docker | 29.4.2 |
| App path | /opt/proxy-reseller |
| Containers | deploy-db-1, deploy-app-1, deploy-caddy-1 |

## SSH Access

```bash
ssh -i ~/.ssh/proxy_reseller_deploy root@72.62.117.94
```

## Deploy Updated Code

### Release preparation

- Use Node.js 22+ and Docker Compose v2 with `up --wait` support.
- Run `npm run typecheck`, `npm run build`, and `npm audit --omit=dev` locally.
- Configure the server's `/opt/proxy-reseller/.env` before deploying. Use a strong
  `AUTH_SECRET`, `AUTH_URL=https://proxymobile.shop`, the production database URL,
  and valid reseller and Stripe credentials. Local development placeholders are
  not suitable for production. Keep credentials out of source control.
- Run `npm run check:production` against the intended production environment.
  Inside the image, use `node scripts/check-production-env.mjs` (environment is
  supplied by Compose). The check prints variable names only, never credentials.
- Back up the database and apply any outstanding files in `db/migrations/` in
  numeric order before releasing code that needs them. Compose initializes
  `db/schema.sql` only for a new database volume; it does not migrate existing databases.
- Docker excludes `.env*` and local build artifacts. Secrets enter at runtime.
  Country availability can be unknown on the initial secret-free build and
  refreshes through the existing ten-minute revalidation.
- Run `bash deploy/deploy.sh` for the guarded release path. It preserves server
  environment files, validates configuration before replacing the running app,
  and waits for container health. Its health check verifies HTTP availability;
  it does not prove payment, database, or upstream proxy connectivity.
- After release, verify login, one controlled purchase, webhook crediting,
  and proxy access using a designated test account. Confirm Stripe live mode
  before accepting real customer payments.

The manual commands below bypass the script's configuration validation and health wait.

From local machine:
```bash
# 1. Sync code
rsync -avz --delete \
  --exclude='.git' --exclude='node_modules' --exclude='.next' \
  --exclude='.env' --exclude='.env.*' --exclude='*.tsbuildinfo' \
  -e "ssh -i ~/.ssh/proxy_reseller_deploy" \
  ./ root@72.62.117.94:/opt/proxy-reseller/

# 2. Rebuild on server
ssh -i ~/.ssh/proxy_reseller_deploy root@72.62.117.94 bash -c '
  cd /opt/proxy-reseller/deploy
  export DB_PASSWORD=$(grep DATABASE_URL /opt/proxy-reseller/.env | sed -n "s/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p")
  docker compose -f docker-compose.prod.yml build app
  docker compose -f docker-compose.prod.yml up -d app
'
```

## View Logs

```bash
# App logs
ssh root@72.62.117.94 "cd /opt/proxy-reseller/deploy && docker compose -f docker-compose.prod.yml logs -f app"

# DB logs
ssh root@72.62.117.94 "cd /opt/proxy-reseller/deploy && docker compose -f docker-compose.prod.yml logs -f db"

# All
ssh root@72.62.117.94 "cd /opt/proxy-reseller/deploy && docker compose -f docker-compose.prod.yml logs -f"
```

## Database Access

```bash
ssh root@72.62.117.94 "docker exec -it deploy-db-1 psql -U proxy_reseller"
```

## Container Management

```bash
# Status
docker compose -f docker-compose.prod.yml ps

# Restart app
docker compose -f docker-compose.prod.yml restart app

# Full restart
docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml up -d

# Clean rebuild
docker compose -f docker-compose.prod.yml build --no-cache app
```

## Add Domain + TLS

1. Point DNS A record to 72.62.117.94
2. Update `deploy/Caddyfile`:
```
yourdomain.com {
    reverse_proxy app:3000
}
```
3. Update `.env`: `AUTH_URL=https://yourdomain.com`
4. Redeploy
