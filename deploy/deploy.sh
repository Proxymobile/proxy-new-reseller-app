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
# The server-side half is a file (rsynced above), not a heredoc on stdin:
# see the comment at the top of remote-deploy.sh for why that matters.
# -n closes stdin so nothing on either side can consume it by accident.
ssh -n -i "$DEPLOY_KEY" "$SERVER" "bash $APP_DIR/deploy/remote-deploy.sh"
