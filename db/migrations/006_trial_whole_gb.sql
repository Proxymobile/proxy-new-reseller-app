-- The Proxies.sx platform only accepts whole-GB pool-key caps (@IsInt @Min(1)),
-- so a 0.2 GB trial was rejected upstream on every redemption. The trial is
-- now 1 GB, and a CHECK constraint keeps fractional grants out for good.
-- Idempotent.

UPDATE promo_codes
SET grant_gb = 1, credit_usd = 7.00, description = 'Free 1 GB welcome trial'
WHERE code = 'START200';

UPDATE promo_codes SET grant_gb = CEIL(grant_gb)
WHERE grant_gb IS NOT NULL AND grant_gb <> CEIL(grant_gb);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promo_codes_grant_gb_whole') THEN
    ALTER TABLE promo_codes ADD CONSTRAINT promo_codes_grant_gb_whole
      CHECK (grant_gb IS NULL OR (grant_gb >= 1 AND grant_gb = TRUNC(grant_gb)));
  END IF;
END $$;
