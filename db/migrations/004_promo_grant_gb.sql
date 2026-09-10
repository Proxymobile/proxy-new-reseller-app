-- Promo codes can grant proxy traffic directly (free trial) instead of only
-- crediting USD balance. When grant_gb IS NOT NULL, redemption provisions that
-- many GB onto the user's pool key — so a "200 MB free" offer is actually
-- usable even though the minimum paid purchase is larger.
-- Idempotent.

ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS grant_gb NUMERIC(6,2);

-- START200 now grants 0.2 GB (200 MB) of real traffic rather than $1.40 credit
-- that could never meet the minimum purchase.
UPDATE promo_codes SET grant_gb = 0.2 WHERE code = 'START200';
