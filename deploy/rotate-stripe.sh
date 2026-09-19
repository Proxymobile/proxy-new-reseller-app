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

# ─── Ask Stripe which account these keys actually belong to ───
# Prefix validation only proves the key is well-formed. This proves it is the
# RIGHT account, which is the mistake worth catching before money moves.
if ! command -v curl >/dev/null 2>&1; then
  echo "ERROR: curl is required to verify the account." >&2; exit 1
fi

echo
echo "==> Asking Stripe which account this key belongs to..."
ACCT_JSON="$(curl -sS -u "$NEW_SECRET:" https://api.stripe.com/v1/account || true)"

if [ -z "$ACCT_JSON" ]; then
  echo "ERROR: could not reach api.stripe.com. Nothing was changed." >&2; exit 1
fi

# Parse with python3 when present (Ubuntu 24.04 ships it); fall back to grep.
describe_account() {
  if command -v python3 >/dev/null 2>&1; then
    python3 - "$ACCT_JSON" <<'PYEOF'
import json, sys
try:
    a = json.loads(sys.argv[1])
except Exception:
    print("PARSE_ERROR"); raise SystemExit(0)
if "error" in a:
    print("API_ERROR\t" + a["error"].get("message", "unknown error"))
    raise SystemExit(0)
bp = a.get("business_profile") or {}
print("\t".join([
    "OK",
    a.get("id", "?"),
    bp.get("name") or a.get("settings", {}).get("dashboard", {}).get("display_name") or "(no business name set)",
    a.get("email") or "(no email)",
    a.get("country") or "?",
    str(a.get("charges_enabled")),
    str(a.get("payouts_enabled")),
]))
PYEOF
  else
    echo "OK\t$(echo "$ACCT_JSON" | grep -o '"id": *"[^"]*"' | head -1 | cut -d'"' -f4)\t(install python3 for full details)\t?\t?\t?\t?"
  fi
}

IFS=$'\t' read -r A_STATUS A_ID A_NAME A_EMAIL A_COUNTRY A_CHARGES A_PAYOUTS <<< "$(describe_account)"

case "$A_STATUS" in
  API_ERROR)
    echo "ERROR: Stripe rejected that secret key: $A_ID" >&2
    echo "Nothing was changed." >&2
    exit 1 ;;
  PARSE_ERROR|"")
    echo "ERROR: could not read Stripe's reply. Nothing was changed." >&2; exit 1 ;;
esac

MODE="TEST"
[ "${NEW_SECRET:0:7}" = "sk_live" ] && MODE="LIVE"

echo
echo "  ┌──────────────────────────────────────────────────────"
echo "  │ Account:  $A_NAME"
echo "  │ ID:       $A_ID"
echo "  │ Email:    $A_EMAIL"
echo "  │ Country:  $A_COUNTRY"
echo "  │ Mode:     $MODE"
echo "  │ Charges:  $A_CHARGES     Payouts: $A_PAYOUTS"
echo "  └──────────────────────────────────────────────────────"
echo

if [ "$A_CHARGES" != "True" ] && [ "$A_CHARGES" != "true" ]; then
  echo "  WARNING: this account cannot accept charges yet (charges_enabled is false)."
  echo "           Finish onboarding in the Stripe Dashboard or deposits will fail."
  echo
fi

read -rp "Is that the account you want to connect? [y/N] " CONFIRM
case "$CONFIRM" in
  y|Y|yes|YES) ;;
  *) echo "Aborted. Nothing was changed."; exit 1 ;;
esac

# ─── Check the new account has a webhook endpoint pointing here ───
# A correct key with no endpoint means payments succeed at Stripe and never
# credit a balance — the worst failure mode, because it looks like it worked.
echo
echo "==> Checking webhook endpoints on this account..."
WH_JSON="$(curl -sS -u "$NEW_SECRET:" https://api.stripe.com/v1/webhook_endpoints?limit=100 || true)"

if command -v python3 >/dev/null 2>&1; then
  python3 - "$WH_JSON" <<'PYEOF'
import json, sys
try:
    d = json.loads(sys.argv[1])
except Exception:
    print("  Could not read the endpoint list — check it by hand in the Dashboard."); raise SystemExit(0)
if "error" in d:
    print("  Could not list endpoints: " + d["error"].get("message", "?")); raise SystemExit(0)
rows = d.get("data", [])
ours = [e for e in rows if "proxymobile.shop" in (e.get("url") or "")]
if not ours:
    print("  WARNING: no endpoint on this account points at proxymobile.shop.")
    print("           Add one at Developers -> Webhooks:")
    print("             URL:   https://proxymobile.shop/api/stripe/webhook")
    print("             Event: checkout.session.completed")
    print("           Its signing secret is the whsec_ value you just entered.")
    raise SystemExit(0)
for e in ours:
    events = e.get("enabled_events") or []
    ok = "checkout.session.completed" in events or "*" in events
    print(f"  {e.get('url')}")
    print(f"    status: {e.get('status')}   listening to checkout.session.completed: {'yes' if ok else 'NO'}")
    if not ok:
        print("    WARNING: add checkout.session.completed to this endpoint or deposits will never credit.")
PYEOF
else
  echo "  (python3 not present — verify the endpoint by hand in the Dashboard.)"
fi
echo

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
# docker-compose.prod.yml declares ${DB_PASSWORD:?...}, so compose refuses to
# run without it. Without this export the restart fails *after* the new keys
# are already written — leaving the app live on the old account while this
# script reports success. Mirror what deploy/remote-deploy.sh does.
export DB_PASSWORD=$(grep DATABASE_URL "$ENV_FILE" | sed 's/.*:\(.*\)@.*/\1/')
: "${DB_PASSWORD:?could not parse DB password from DATABASE_URL in $ENV_FILE}"

echo "==> Restarting app container..."
cd "$APP_DIR/deploy"
COMPOSE="docker compose --env-file $ENV_FILE -f docker-compose.prod.yml"
$COMPOSE up -d --force-recreate app
sleep 4
$COMPOSE ps app

echo
echo "==> Done. Now verify, in this order:"
echo "    1. The account and its webhook endpoint were checked above — re-read"
echo "       any WARNING printed there before taking payments."
echo "    2. Send a test event from that endpoint and confirm a 200."
echo "    3. Make a real \$5 deposit and check the balance credits (plus the"
echo "       \$2 welcome bonus if that account has never deposited before)."
echo "    4. Roll back at any point with:"
echo "       cp $BACKUP $ENV_FILE && cd $APP_DIR/deploy && \\"
echo "       export DB_PASSWORD=\$(grep DATABASE_URL $ENV_FILE | sed 's/.*:\\(.*\\)@.*/\\1/') && \\"
echo "       docker compose --env-file $ENV_FILE -f docker-compose.prod.yml up -d --force-recreate app"
