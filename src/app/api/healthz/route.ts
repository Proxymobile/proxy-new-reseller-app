import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { getInventory } from '@/lib/inventory';
import { isStripeConfigured } from '@/lib/payments';

export const dynamic = 'force-dynamic';

function isRealValue(value: string | undefined, shape: RegExp): boolean {
  const v = value?.trim() ?? '';
  return shape.test(v) && !/placeholder|your_/i.test(v);
}

/**
 * Deployment health check — safe to expose publicly: booleans only, never
 * secrets. 200 when customers can sign up, buy and connect; 503 otherwise.
 *
 *   curl -s https://proxymobile.shop/api/healthz
 */
export async function GET() {
  const checks = {
    database: false,
    // Latest migration applied (006: whole-GB trial constraint).
    schemaUpToDate: false,
    proxiesApiKey: isRealValue(process.env.PROXIES_SX_API_KEY, /^psx_[a-z0-9]{16,}$/i),
    // The gateway username contains no '-' (it is split on '-').
    proxiesUsername: isRealValue(process.env.PROXIES_SX_USERNAME, /^[a-z0-9_]{3,}$/i),
    upstreamInventory: false,
    cardPayments: isStripeConfigured(),
  };

  try {
    await queryOne('SELECT 1');
    checks.database = true;
    const row = await queryOne<{ ok: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promo_codes_grant_gb_whole') AS ok",
    );
    checks.schemaUpToDate = Boolean(row?.ok);
  } catch {
    // leave false
  }

  const inventory = await getInventory();
  checks.upstreamInventory = Boolean(inventory && inventory.countries.some((c) => c.mobile > 0));

  // Card payments are optional (manual top-ups are the fallback).
  const required = [checks.database, checks.schemaUpToDate, checks.proxiesApiKey, checks.proxiesUsername, checks.upstreamInventory];
  const ok = required.every(Boolean);
  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 503 });
}
