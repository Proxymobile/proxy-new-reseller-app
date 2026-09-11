-- First top-up welcome bonus.
--
-- New customers get a small credit ($2) the first time a top-up settles, so a
-- trial can be funded without committing to a full purchase. The timestamp is
-- set in the SAME conditional UPDATE that adds the credit, so concurrent or
-- replayed Stripe webhooks can never grant it twice.
-- Idempotent.

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_topup_bonus_at TIMESTAMPTZ;
