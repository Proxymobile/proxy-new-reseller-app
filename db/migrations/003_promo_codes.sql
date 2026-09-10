-- Promo codes: free-MB / credit vouchers with anti-abuse limits.
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS promo_codes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT UNIQUE NOT NULL,
  description      TEXT,
  credit_usd       NUMERIC(10,2) NOT NULL CHECK (credit_usd > 0 AND credit_usd <= 100),
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

-- Seed the launch code: 200 MB free at the $7/GB entry rate = $1.40 credit.
INSERT INTO promo_codes (code, description, credit_usd, max_redemptions, per_ip_limit, new_users_only)
VALUES ('START200', 'Free 200 MB welcome credit', 1.40, 500, 1, true)
ON CONFLICT (code) DO NOTHING;
