-- Proxy Reseller App — PostgreSQL Schema
-- Idempotent: safe to re-run (uses IF NOT EXISTS)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Core user table — access code is the sole credential
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT NOT NULL,
  email       TEXT,
  access_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  role        TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  balance_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  enabled     BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One-time welcome bonus on the user's first successful top-up. NULL means the
-- bonus has not been granted yet; the timestamp is set atomically alongside the
-- credit so it can never be granted twice. See migrations/005.
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_topup_bonus_at TIMESTAMPTZ;

-- Wallet links — optional 2FA via Solana or Ethereum
CREATE TABLE IF NOT EXISTS wallet_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chain       TEXT NOT NULL CHECK (chain IN ('solana', 'ethereum')),
  address     TEXT NOT NULL,
  verified    BOOLEAN NOT NULL DEFAULT false,
  linked_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (chain, address)
);

-- Ephemeral challenges for wallet signature verification
CREATE TABLE IF NOT EXISTS wallet_challenges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nonce       TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  chain       TEXT NOT NULL CHECK (chain IN ('solana', 'ethereum')),
  address     TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
  used        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rate limiting for login attempts
CREATE TABLE IF NOT EXISTS login_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code_hash TEXT NOT NULL,
  ip_address      INET,
  success         BOOLEAN NOT NULL DEFAULT false,
  attempted_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoice number sequence
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1001;

-- Balance tracking — unified ledger for all deposits and purchases
CREATE TABLE IF NOT EXISTS balance_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_usd      NUMERIC(10,2) NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  reason          TEXT NOT NULL,
  reference       TEXT,
  payment_method  TEXT NOT NULL DEFAULT 'admin' CHECK (payment_method IN ('admin', 'stripe', 'crypto', 'balance', 'system')),
  invoice_number  TEXT UNIQUE,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Business tables
CREATE TABLE IF NOT EXISTS customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pak_key_id      TEXT,
  pak_key         TEXT,
  traffic_cap_gb  NUMERIC(10,2) DEFAULT 0,
  traffic_used_gb NUMERIC(10,2) DEFAULT 0,
  plan_id         TEXT,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_pak_key_pair CHECK (
    (pak_key_id IS NULL AND pak_key IS NULL) OR
    (pak_key_id IS NOT NULL AND pak_key IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS purchases (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  plan_id           TEXT NOT NULL,
  gb_amount         NUMERIC(10,2) NOT NULL,
  price_usd         NUMERIC(10,2) NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type      TEXT NOT NULL,
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  metadata    JSONB DEFAULT '{}',
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_access_code ON users(access_code);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_wallet_links_user ON wallet_links(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_links_address ON wallet_links(address);
CREATE INDEX IF NOT EXISTS idx_wallet_challenges_nonce ON wallet_challenges(nonce);
CREATE INDEX IF NOT EXISTS idx_wallet_challenges_user ON wallet_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_hash ON login_attempts(access_code_hash);
CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON login_attempts(attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_pak_key_id ON customers(pak_key_id);
CREATE INDEX IF NOT EXISTS idx_purchases_customer_id ON purchases(customer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_session ON purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe ON webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_balance_tx_user ON balance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_tx_created ON balance_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_balance_tx_invoice ON balance_transactions(invoice_number);
CREATE INDEX IF NOT EXISTS idx_balance_tx_method ON balance_transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- Promo codes (see migrations/003_promo_codes.sql)

CREATE TABLE IF NOT EXISTS promo_codes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT UNIQUE NOT NULL,
  description      TEXT,
  credit_usd       NUMERIC(10,2) NOT NULL CHECK (credit_usd > 0 AND credit_usd <= 100),
  grant_gb         NUMERIC(6,2),                     -- if set, provision this much traffic instead of USD credit
  max_redemptions  INTEGER,                          -- NULL = unlimited
  redemption_count INTEGER NOT NULL DEFAULT 0,
  per_ip_limit     INTEGER NOT NULL DEFAULT 1,       -- max redemptions per IP address
  new_users_only   BOOLEAN NOT NULL DEFAULT false,   -- account must be < 7 days old
  active           BOOLEAN NOT NULL DEFAULT true,
  expires_at       TIMESTAMPTZ,
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promo_redemptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id     UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address   INET,
  credited_usd NUMERIC(10,2) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (promo_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_promo ON promo_redemptions(promo_id);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_user ON promo_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_ip ON promo_redemptions(ip_address);

-- Seed the launch code: 200 MB of real proxy traffic provisioned on redemption
-- (grant_gb = 0.2). credit_usd carries the reference value only.
INSERT INTO promo_codes (code, description, credit_usd, grant_gb, max_redemptions, per_ip_limit, new_users_only)
VALUES ('START200', 'Free 200 MB welcome trial', 1.40, 0.2, 500, 1, true)
ON CONFLICT (code) DO NOTHING;

-- First-party page-view counts (see migrations/006_page_views.sql)
CREATE TABLE IF NOT EXISTS page_views_daily (
  day     DATE    NOT NULL,
  path    TEXT    NOT NULL,
  source  TEXT    NOT NULL DEFAULT 'direct',
  device  TEXT    NOT NULL DEFAULT 'desktop' CHECK (device IN ('mobile', 'desktop')),
  views   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path, source, device)
);
CREATE INDEX IF NOT EXISTS idx_page_views_day ON page_views_daily(day DESC);

-- SEO tracker + password logins (see migrations/007_seo_and_admin_logins.sql)
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
