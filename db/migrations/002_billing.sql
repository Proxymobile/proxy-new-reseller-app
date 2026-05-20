-- Migration: Add invoice tracking to balance_transactions
-- Safe to re-run (uses IF NOT EXISTS / IF NOT EXISTS patterns)

CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1001;

DO $$ BEGIN
  ALTER TABLE balance_transactions ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'admin';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE balance_transactions ADD COLUMN invoice_number TEXT UNIQUE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE balance_transactions ADD CONSTRAINT chk_payment_method
    CHECK (payment_method IN ('admin', 'stripe', 'crypto', 'balance', 'system'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_balance_tx_invoice ON balance_transactions(invoice_number);
CREATE INDEX IF NOT EXISTS idx_balance_tx_method ON balance_transactions(payment_method);

-- Backfill invoice numbers for existing transactions
UPDATE balance_transactions
SET invoice_number = 'INV-' || nextval('invoice_seq')
WHERE invoice_number IS NULL;
