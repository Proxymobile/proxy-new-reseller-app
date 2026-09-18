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
  --exclude='.env.*' \
  --exclude='*.tsbuildinfo' \
  -e "ssh -i $DEPLOY_KEY" \
  "$(dirname "$0")/../" \
  "$SERVER:$APP_DIR/"

echo "==> Building and starting on server..."
ssh -i "$DEPLOY_KEY" "$SERVER" bash -s <<'REMOTE'
set -euo pipefail
cd /opt/proxy-reseller

# Production credentials must be configured before a release.
if [ ! -f .env ]; then
  echo "Configure /opt/proxy-reseller/.env with production credentials before deploying." >&2
  exit 1
fi

# Extract DB_PASSWORD for compose
export DB_PASSWORD=$(grep DATABASE_URL .env | sed 's/.*:\(.*\)@.*/\1/')

cd deploy
docker compose --env-file ../.env -f docker-compose.prod.yml build --no-cache
# -T and </dev/null: this script arrives on stdin, and an interactive `run`
# would swallow the remaining lines, silently skipping `up` below.
docker compose --env-file ../.env -f docker-compose.prod.yml run -T --rm --no-deps app node scripts/check-production-env.mjs < /dev/null
docker compose --env-file ../.env -f docker-compose.prod.yml up -d --wait --wait-timeout 120

docker compose --env-file ../.env -f docker-compose.prod.yml ps
echo "==> Deployment complete!"
REMOTE
