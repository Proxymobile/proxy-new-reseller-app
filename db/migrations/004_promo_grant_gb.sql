-- Promo codes can grant proxy traffic directly (free trial) instead of only
-- crediting USD balance. When grant_gb IS NOT NULL, redemption provisions that
-- many GB onto the user's pool key — so a free-trial offer is actually usable
-- even though the minimum paid purchase is larger.
-- Idempotent.

ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS grant_gb NUMERIC(6,2);

-- START200 grants real traffic rather than a credit that could never meet the
-- minimum purchase. It must be a whole number of GB: the upstream rejects
-- fractional caps, and migrations/006 + schema.sql enforce that with a CHECK
-- (originally 0.2 here, which failed upstream on every redemption).
UPDATE promo_codes SET grant_gb = 1 WHERE code = 'START200';
