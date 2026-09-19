#!/bin/bash
#
# Server-side half of deploy.sh. Runs on the production host, from
# /opt/proxy-reseller/deploy, after deploy.sh has rsynced the code.
#
# It lives in its own file on purpose. It used to be a heredoc piped into
# `ssh bash -s`, which meant the script itself was on bash's stdin — so any
# command that read stdin (docker compose run, psql -c) consumed the rest of
# the script, and the deploy exited 0 having silently skipped everything after
# it. Running it as a file leaves stdin free and removes that whole class of
# failure.
set -euo pipefail

cd /opt/proxy-reseller

# Production credentials must be configured before a release.
if [ ! -f .env ]; then
  echo "Configure /opt/proxy-reseller/.env with production credentials before deploying." >&2
  exit 1
fi

export DB_PASSWORD=$(grep DATABASE_URL .env | sed 's/.*:\(.*\)@.*/\1/')

cd deploy
COMPOSE="docker compose --env-file ../.env -f docker-compose.prod.yml"

$COMPOSE build --no-cache
$COMPOSE run -T --rm --no-deps app node scripts/check-production-env.mjs

# ── Schema first, code second ───────────────────────────────────────────────
# Migrations run BEFORE the new app container starts serving, so code never
# goes live ahead of the schema it needs. Bring up only the database for this,
# then start the rest once the schema is current.
#
# Applied migrations are recorded in schema_migrations, so each file runs
# exactly once even if it is not idempotent. A database that predates this
# ledger needs its already-applied filenames seeded once — see docs/DEPLOY.md,
# otherwise every old migration replays on the next deploy.
$COMPOSE up -d --wait --wait-timeout 120 db

DB_USER=$(sed -n 's#^DATABASE_URL=postgresql://\([^:]*\):.*#\1#p' ../.env)
DB_NAME=$(sed -n 's#^DATABASE_URL=.*/\([^/?]*\)$#\1#p' ../.env)
: "${DB_USER:?could not parse DB user from DATABASE_URL}"
: "${DB_NAME:?could not parse DB name from DATABASE_URL}"

psql_base() { $COMPOSE exec -T db psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 "$@"; }
# Explicit stdin on every call, so neither form can ever read something it
# was not given deliberately.
psql_cmd()  { psql_base "$@" < /dev/null; }
psql_file() { psql_base -q < "$1"; }

echo "==> Applying database schema..."
psql_cmd -q -c "CREATE TABLE IF NOT EXISTS schema_migrations (
  filename   TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);"

# schema.sql is the BOOTSTRAP for an empty database, not a desired-state file:
# alongside its CREATE TABLE IF NOT EXISTS it also seeds rows (e.g. the START200
# promo at grant_gb 0.2). Replaying it against a live database fails, because
# promo_codes now carries a whole-GB check constraint that the seed violates,
# and it would fight whatever operators have since configured. So it runs only
# when there is nothing there yet; after that, migrations are the only path.
if [ "$(psql_cmd -Atc "SELECT to_regclass('public.users') IS NOT NULL")" = "t" ]; then
  echo "    bootstrap already present, skipping schema.sql"
else
  echo "    fresh database — applying schema.sql"
  psql_file ../db/schema.sql
fi

applied=0
for migration in $(ls ../db/migrations/*.sql | sort); do
  name=$(basename "$migration")
  if [ "$(psql_cmd -Atc "SELECT 1 FROM schema_migrations WHERE filename = '$name'")" = "1" ]; then
    echo "    skip  $name"
    continue
  fi
  echo "    apply $name"
  psql_file "$migration"
  psql_cmd -q -c "INSERT INTO schema_migrations (filename) VALUES ('$name')"
  applied=$((applied + 1))
done
echo "==> Schema current ($applied newly applied)"

echo "==> Starting application..."
$COMPOSE up -d --wait --wait-timeout 120

$COMPOSE ps
echo "==> Deployment complete!"
