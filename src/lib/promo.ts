import { query, queryOne } from '@/lib/db';
import { provisionTraffic } from '@/lib/provision';

/**
 * Shared promo-code redemption logic.
 * Used by POST /api/promo/redeem (logged-in users) and the signup route.
 *
 * Anti-abuse layers:
 *  - one redemption per (promo, user) — DB unique constraint
 *  - per-IP redemption limit per code
 *  - global max_redemptions cap, claimed atomically
 *  - optional new_users_only (account < 7 days old)
 *  - expiry date + active flag
 */

const CODE_RE = /^[A-Z0-9_-]{3,32}$/;
const NEW_USER_WINDOW = "7 days";

export interface RedeemResult {
  ok: boolean;
  creditedUsd?: number;
  grantedGb?: number;
  error?: string;
}

const TRIAL_DURATION_DAYS = 30;

interface PromoRow {
  id: string;
  code: string;
  credit_usd: string;
  grant_gb: string | null;
  max_redemptions: number | null;
  redemption_count: number;
  per_ip_limit: number;
  new_users_only: boolean;
  active: boolean;
  expires_at: string | null;
}

export function extractIp(request: Request): string | null {
  // Behind a single trusted reverse proxy (Caddy). The client can forge the
  // LEFTMOST X-Forwarded-For entry, so never trust it for abuse limits. Prefer
  // X-Real-IP (set by Caddy) and otherwise take the RIGHTMOST XFF hop — the
  // address the proxy actually observed.
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) {
    const parts = fwd.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return null;
}

export async function redeemPromoCode(
  userId: string,
  rawCode: string,
  ip: string | null,
): Promise<RedeemResult> {
  const code = rawCode.trim().toUpperCase();
  if (!CODE_RE.test(code)) {
    return { ok: false, error: 'Invalid code format' };
  }

  const promo = await queryOne<PromoRow>(
    'SELECT * FROM promo_codes WHERE code = $1',
    [code],
  );
  if (!promo || !promo.active) {
    return { ok: false, error: 'Invalid or inactive promo code' };
  }
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return { ok: false, error: 'This promo code has expired' };
  }

  // One per user
  const existing = await queryOne(
    'SELECT 1 FROM promo_redemptions WHERE promo_id = $1 AND user_id = $2',
    [promo.id, userId],
  );
  if (existing) {
    return { ok: false, error: 'You already redeemed this code' };
  }

  // New-users-only gate
  if (promo.new_users_only) {
    const fresh = await queryOne(
      `SELECT 1 FROM users WHERE id = $1 AND created_at > now() - interval '${NEW_USER_WINDOW}'`,
      [userId],
    );
    if (!fresh) {
      return { ok: false, error: 'This code is for new accounts only' };
    }
  }

  // Per-IP limit
  if (ip && promo.per_ip_limit > 0) {
    const ipCount = await queryOne<{ n: string }>(
      'SELECT COUNT(*)::text AS n FROM promo_redemptions WHERE promo_id = $1 AND ip_address = $2',
      [promo.id, ip],
    );
    if (Number(ipCount?.n ?? 0) >= promo.per_ip_limit) {
      return { ok: false, error: 'Redemption limit reached for this network' };
    }
  }

  const grantGb = promo.grant_gb != null ? Number(promo.grant_gb) : null;
  const credit = Number(promo.credit_usd);

  // Atomically claim a slot against the global cap
  const claimed = await queryOne<{ credit_usd: string }>(
    `UPDATE promo_codes
     SET redemption_count = redemption_count + 1
     WHERE id = $1 AND active = true
       AND (max_redemptions IS NULL OR redemption_count < max_redemptions)
     RETURNING credit_usd`,
    [promo.id],
  );
  if (!claimed) {
    return { ok: false, error: 'This promo code has been fully redeemed' };
  }

  let redemptionId: string;
  try {
    const row = await queryOne<{ id: string }>(
      `INSERT INTO promo_redemptions (promo_id, user_id, ip_address, credited_usd)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [promo.id, userId, ip, credit],
    );
    redemptionId = row!.id;
  } catch {
    // Unique violation (double-submit race) — release the claimed slot
    await query(
      'UPDATE promo_codes SET redemption_count = redemption_count - 1 WHERE id = $1',
      [promo.id],
    );
    return { ok: false, error: 'You already redeemed this code' };
  }

  if (grantGb && grantGb > 0) {
    // Trial: provision real proxy traffic instead of USD credit.
    try {
      // Keyed on the redemption row: a failed attempt deletes its row, so a
      // retry gets a fresh key rather than the platform's cached failure.
      await provisionTraffic(userId, grantGb, TRIAL_DURATION_DAYS, `promo-${redemptionId}`);
    } catch (err) {
      // Provider failed — roll back the redemption so the user can retry.
      await query('DELETE FROM promo_redemptions WHERE promo_id = $1 AND user_id = $2', [promo.id, userId]);
      await query('UPDATE promo_codes SET redemption_count = redemption_count - 1 WHERE id = $1', [promo.id]);
      console.error('[promo] Trial provisioning failed:', err instanceof Error ? err.message : err);
      return { ok: false, error: 'Could not activate trial right now — please try again shortly' };
    }

    await query(
      `INSERT INTO balance_transactions (user_id, amount_usd, type, reason, reference, payment_method)
       VALUES ($1, 0, 'credit', $2, $3, 'system')`,
      [userId, `Promo trial ${code}: ${grantGb} GB`, code],
    );
    await query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata, ip_address)
       VALUES ($1, 'promo_redeem', 'promo_code', $2, $3, $4)`,
      [userId, promo.id, JSON.stringify({ code, grantGb }), ip],
    );

    return { ok: true, grantedGb: grantGb };
  }

  // Balance-credit promo
  await query(
    'UPDATE users SET balance_usd = balance_usd + $1, updated_at = now() WHERE id = $2',
    [credit, userId],
  );

  await query(
    `INSERT INTO balance_transactions (user_id, amount_usd, type, reason, reference, payment_method)
     VALUES ($1, $2, 'credit', $3, $4, 'system')`,
    [userId, credit, `Promo code ${code}`, code],
  );

  await query(
    `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata, ip_address)
     VALUES ($1, 'promo_redeem', 'promo_code', $2, $3, $4)`,
    [userId, promo.id, JSON.stringify({ code, credit }), ip],
  );

  return { ok: true, creditedUsd: credit };
}
