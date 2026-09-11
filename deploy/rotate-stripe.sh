#!/bin/bash
#
# Point the app at a different Stripe account.
#
# Run this ON THE SERVER, as root, from /opt/proxy-reseller:
#   bash deploy/rotate-stripe.sh
#
# It prompts for the three values, so nothing secret is typed into a chat,
# committed to git, or left in your shell history. The old .env is backed up
# first, and the previous webhook secret is kept for a transition window so
# events already in flight from the old account still verify.
#
set -euo pipefail

APP_DIR="/opt/proxy-reseller"
ENV_FILE="$APP_DIR/.env"

cd "$APP_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found. Are you on the right server?" >&2
  exit 1
fi

# ─── Read the new values without echoing them ───
read -rsp "New STRIPE_SECRET_KEY (sk_live_... or sk_test_...): " NEW_SECRET; echo
read -rsp "New STRIPE_WEBHOOK_SECRET (whsec_...):              " NEW_WHSEC; echo
read -rp  "New NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_...):    " NEW_PUB

# ─── Validate prefixes before touching anything ───
case "$NEW_SECRET" in
  sk_live_*|sk_test_*) ;;
  *) echo "ERROR: secret key must start with sk_live_ or sk_test_" >&2; exit 1 ;;
esac
case "$NEW_WHSEC" in
  whsec_*) ;;
  *) echo "ERROR: webhook secret must start with whsec_" >&2; exit 1 ;;
esac
case "$NEW_PUB" in
  pk_live_*|pk_test_*) ;;
  *) echo "ERROR: publishable key must start with pk_live_ or pk_test_" >&2; exit 1 ;;
esac

# Live secret key with a test publishable key (or vice versa) is a classic
# half-migrated state — catch it here rather than at the first payment.
if [ "${NEW_SECRET:0:7}" = "sk_live" ] && [ "${NEW_PUB:0:7}" != "pk_live" ]; then
  echo "ERROR: live secret key paired with a non-live publishable key." >&2; exit 1
fi
if [ "${NEW_SECRET:0:7}" = "sk_test" ] && [ "${NEW_PUB:0:7}" != "pk_test" ]; then
  echo "ERROR: test secret key paired with a non-test publishable key." >&2; exit 1
fi

# ─── Back up, then rewrite the three keys in place ───
BACKUP="$ENV_FILE.bak.$(date +%Y%m%d-%H%M%S)"
cp "$ENV_FILE" "$BACKUP"
chmod 600 "$BACKUP"
echo "==> Backed up current .env to $BACKUP"

OLD_WHSEC="$(grep -E '^STRIPE_WEBHOOK_SECRET=' "$ENV_FILE" | cut -d= -f2- || true)"

set_env() {
  local key="$1" value="$2"
  if grep -qE "^${key}=" "$ENV_FILE"; then
    # Use a delimiter that cannot appear in a Stripe key.
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

set_env STRIPE_SECRET_KEY "$NEW_SECRET"
set_env STRIPE_WEBHOOK_SECRET "$NEW_WHSEC"
set_env NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY "$NEW_PUB"

# Keep the old signing secret so in-flight events from the old account still
# verify. Remove this line once the old account has stopped sending.
if [ -n "$OLD_WHSEC" ] && [ "$OLD_WHSEC" != "$NEW_WHSEC" ]; then
  set_env STRIPE_WEBHOOK_SECRET_PREVIOUS "$OLD_WHSEC"
  echo "==> Kept the previous webhook secret as STRIPE_WEBHOOK_SECRET_PREVIOUS"
  echo "    Delete that line from .env once the old account is quiet."
fi

chmod 600 "$ENV_FILE"

# ─── Restart just the app so it picks up the new env ───
echo "==> Restarting app container..."
cd "$APP_DIR/deploy"
docker compose -f docker-compose.prod.yml up -d --force-recreate app
sleep 4
docker compose -f docker-compose.prod.yml ps app

echo
echo "==> Done. Now verify, in this order:"
echo "    1. Stripe Dashboard -> Developers -> Webhooks: the NEW account has an"
echo "       endpoint at https://proxymobile.shop/api/stripe/webhook listening"
echo "       to checkout.session.completed."
echo "    2. Send a test event from that endpoint and confirm a 200."
echo "    3. Make a real \$5 deposit and check the balance credits (plus the"
echo "       \$2 welcome bonus if that account has never deposited before)."
echo "    4. Roll back at any point with: cp $BACKUP $ENV_FILE && \\"
echo "       docker compose -f docker-compose.prod.yml up -d --force-recreate app"
