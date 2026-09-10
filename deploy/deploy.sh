#!/bin/bash
set -euo pipefail

APP_DIR="/opt/proxy-reseller"
DEPLOY_KEY="$HOME/.ssh/proxy_reseller_deploy"
SERVER="root@72.62.117.94"

echo "==> Syncing code to server..."
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.env' \
  --exclude='.env.local' \
  -e "ssh -i $DEPLOY_KEY" \
  "$(dirname "$0")/../" \
  "$SERVER:$APP_DIR/"

echo "==> Building and starting on server..."
ssh -i "$DEPLOY_KEY" "$SERVER" bash -s <<'REMOTE'
set -euo pipefail
cd /opt/proxy-reseller

# Generate DB password if not exists
if [ ! -f .env ]; then
  DB_PASS=$(openssl rand -hex 16)
  AUTH_SECRET=$(openssl rand -hex 32)
  cat > .env <<EOF
DATABASE_URL=postgresql://proxy_reseller:${DB_PASS}@db:5432/proxy_reseller
AUTH_SECRET=${AUTH_SECRET}
AUTH_URL=https://proxymobile.shop
ADMIN_EMAILS=admin@proxymobile.shop
PROXIES_SX_API_KEY=psx_placeholder
PROXIES_SX_USERNAME=placeholder
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
EMAIL_FROM=noreply@proxyhub.example
EOF
  echo "DB_PASSWORD=${DB_PASS}" > deploy/.env.db
  echo "==> Generated .env with DB_PASSWORD=${DB_PASS}"
else
  echo "==> .env already exists, skipping generation"
fi

# Extract DB_PASSWORD for compose
export DB_PASSWORD=$(grep DATABASE_URL .env | sed 's/.*:\(.*\)@.*/\1/')

cd deploy

# Apply the schema + every migration BEFORE the new app starts. All files are
# idempotent (IF NOT EXISTS / guarded DO blocks), so re-running is safe; any
# error aborts the deploy with the old app still serving.
echo "==> Migrating database..."
docker compose -f docker-compose.prod.yml up -d db
for i in $(seq 1 30); do
  docker compose -f docker-compose.prod.yml exec -T db pg_isready -U proxy_reseller -d proxy_reseller >/dev/null 2>&1 && break
  sleep 1
done
for f in ../db/schema.sql $(ls ../db/migrations/*.sql | sort); do
  echo "    $f"
  docker compose -f docker-compose.prod.yml exec -T db \
    psql -q -v ON_ERROR_STOP=1 -U proxy_reseller -d proxy_reseller < "$f"
done

docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

echo "==> Waiting for services..."
sleep 5
docker compose -f docker-compose.prod.yml ps
echo "==> Health check (ok:true = ready for customers):"
out=""
for i in $(seq 1 20); do
  out=$(curl -s -w ' [HTTP %{http_code}]' http://127.0.0.1:3000/api/healthz || true)
  case "$out" in *"HTTP 000"*|"") sleep 2 ;; *) break ;; esac
done
echo "$out"
echo "==> Deployment complete!"
REMOTE
