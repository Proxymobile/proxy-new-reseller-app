-- 007 — SEO tracker + email/password admin logins.
-- Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- SEO: Google Search Console metric cache
-- ---------------------------------------------------------------------------
-- One row per day/dimension/value. `dimension` is:
--   'site'  → value '' (whole property totals)
--   'query' → value is the search query
--   'page'  → value is the full page URL
-- position is the weighted average position GSC reports for that row.
CREATE TABLE IF NOT EXISTS seo_daily (
  day          DATE    NOT NULL,
  dimension    TEXT    NOT NULL CHECK (dimension IN ('site', 'query', 'page')),
  value        TEXT    NOT NULL,
  clicks       INTEGER NOT NULL DEFAULT 0,
  impressions  INTEGER NOT NULL DEFAULT 0,
  position     NUMERIC(6,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (day, dimension, value)
);
CREATE INDEX IF NOT EXISTS idx_seo_daily_day ON seo_daily(day DESC);
CREATE INDEX IF NOT EXISTS idx_seo_daily_dim ON seo_daily(dimension, day DESC);

-- Keywords you actively track. Ranking data is joined from seo_daily by query.
CREATE TABLE IF NOT EXISTS seo_keywords (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword     TEXT NOT NULL,
  target_path TEXT,                                   -- page that should rank, e.g. /mobile-proxies/us
  priority    TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
  notes       TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_seo_keywords_kw ON seo_keywords(lower(keyword));

-- Sync run history, so the panel can show freshness and surface failures.
CREATE TABLE IF NOT EXISTS seo_sync_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status      TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'ok', 'error')),
  rows_synced INTEGER NOT NULL DEFAULT 0,
  days_synced INTEGER NOT NULL DEFAULT 0,
  error       TEXT,
  triggered_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_seo_sync_started ON seo_sync_log(started_at DESC);

-- ---------------------------------------------------------------------------
-- Email + password logins (staff/admin)
-- ---------------------------------------------------------------------------
-- password_hash holds a self-describing scrypt string (see src/lib/password.ts);
-- it is NULL for accounts that only use an access code or a wallet.
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash        TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_updated_at  TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at        TIMESTAMPTZ;

-- Email is the login identifier for password accounts, so it must be unique
-- when present. Partial index keeps the many NULL-email customers valid.
-- Guarded: if the table already holds duplicate emails the index would abort
-- this whole migration, so we warn instead and leave it to be resolved by hand.
DO $$
DECLARE dupes INTEGER;
BEGIN
  SELECT COUNT(*) INTO dupes FROM (
    SELECT lower(email) FROM users WHERE email IS NOT NULL
    GROUP BY lower(email) HAVING COUNT(*) > 1
  ) d;
  IF dupes = 0 THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
      ON users (lower(email)) WHERE email IS NOT NULL;
  ELSE
    RAISE WARNING 'Skipped idx_users_email_unique: % duplicate email(s) in users. De-duplicate, then create the index.', dupes;
  END IF;
END $$;
