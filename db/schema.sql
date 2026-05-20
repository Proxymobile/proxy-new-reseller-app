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
