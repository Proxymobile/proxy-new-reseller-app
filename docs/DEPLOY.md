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

From local machine:
```bash
# 1. Sync code
rsync -avz --delete \
  --exclude='.git' --exclude='node_modules' --exclude='.next' \
  --exclude='.env' --exclude='.env.local' \
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
