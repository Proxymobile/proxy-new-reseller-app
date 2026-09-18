import { query, queryOne } from '@/lib/db';
import { proxies } from '@/lib/proxies';
import { withTimeout } from '@/lib/admin-metrics';
import { getUsageHistory, recordSnapshots } from '@/lib/usage-snapshots';
import type { PoolAccessKey, PoolStock } from '@proxies-sx/pool-sdk';

/** Server-side data for the customer dashboard. Every query is scoped to one user. */

const n = (v: unknown) => Number(v ?? 0) || 0;

export interface AccountUser {
  id: string; label: string; email: string | null; enabled: boolean;
  balance: number; created_at: string; first_topup_bonus_at: string | null;
}

export interface CustomerKey {
  id: string;
  secret: string;
  enabled: boolean;
  capGb: number | null;
  usedGb: number;
  leftGb: number | null;
  pct: number | null;
  expiresAt: string | null;
  expired: boolean;
  daysLeft: number | null;
  lastUsedAt: string | null;
  createdAt: number;
}

export async function getAccountUser(userId: string): Promise<AccountUser | null> {
  const r = await queryOne<Record<string, string>>(
    'SELECT id, label, email, enabled, balance_usd, created_at, first_topup_bonus_at FROM users WHERE id = $1',
    [userId],
  );
  if (!r) return null;
  return {
    id: r.id, label: r.label, email: r.email, enabled: r.enabled as unknown as boolean,
    balance: n(r.balance_usd), created_at: r.created_at, first_topup_bonus_at: r.first_topup_bonus_at,
  };
}

function toKey(k: PoolAccessKey): CustomerKey {
  const usedGb = (k.trafficUsedMB != null ? k.trafficUsedMB / 1024 : k.trafficUsedGB) ?? 0;
  const capGb = k.trafficCapGB;
  const exp = k.expiresAt ? Date.parse(k.expiresAt) : null;
  const now = Date.now();
  return {
    id: k.id,
    secret: k.key,
    enabled: k.enabled,
    capGb,
    usedGb,
    leftGb: capGb === null ? null : Math.max(0, capGb - usedGb),
    pct: capGb ? Math.min(100, (usedGb / capGb) * 100) : null,
    expiresAt: k.expiresAt,
    expired: k.isExpired ?? (exp !== null && exp < now),
    daysLeft: exp === null ? null : Math.ceil((exp - now) / 86_400_000),
    lastUsedAt: k.lastUsedAt,
    createdAt: k.createdAt,
  };
}

/** Live key from Proxies.sx (null when the customer has none). Also syncs usage to the DB. */
export async function getCustomerKey(userId: string): Promise<{ key: CustomerKey | null; error: string | null; customerId: string | null }> {
  const c = await queryOne<{ id: string; pak_key_id: string | null }>(
    'SELECT id, pak_key_id FROM customers WHERE user_id = $1',
    [userId],
  );
  if (!c?.pak_key_id) return { key: null, error: null, customerId: c?.id ?? null };
  try {
    const raw = await withTimeout(proxies().poolKeys.get(c.pak_key_id), 8000);
    const key = toKey(raw);
    await Promise.all([
      query(
        'UPDATE customers SET traffic_used_gb = $1, traffic_cap_gb = COALESCE($2, traffic_cap_gb), expires_at = $3, updated_at = now() WHERE id = $4',
        [key.usedGb, key.capGb, key.expiresAt, c.id],
      ).catch(() => {}),
      recordSnapshots([{ id: key.id, usedGb: key.usedGb, capGb: key.capGb }]),
    ]);
    return { key, error: null, customerId: c.id };
  } catch (e) {
    console.error('[dashboard] key fetch failed:', e instanceof Error ? e.message : e);
    return { key: null, error: 'We could not reach the proxy network to load your key. Please refresh in a minute.', customerId: c.id };
  }
}

export async function getKeyUsage(keyId: string | null, days = 30) {
  if (!keyId) return { series: [] as { day: string; gb: number }[], firstSnapshot: null as string | null };
  return getUsageHistory(days, keyId);
}

export interface MoneySummary {
  deposited: number; credits: number; spent: number; refunds: number;
  orders: number; gbBought: number; lastPurchase: string | null;
}

export async function getMoneySummary(userId: string): Promise<MoneySummary> {
  const r = await queryOne<Record<string, string>>(`
    SELECT
      COALESCE(SUM(amount_usd) FILTER (WHERE type='credit' AND payment_method IN ('stripe','crypto')),0) AS deposited,
      COALESCE(SUM(amount_usd) FILTER (WHERE type='credit' AND payment_method IN ('system','admin') AND reason NOT LIKE 'Refund%'),0) AS credits,
      COALESCE(SUM(amount_usd) FILTER (WHERE type='debit'),0) AS spent,
      COALESCE(SUM(amount_usd) FILTER (WHERE type='credit' AND reason LIKE 'Refund%'),0) AS refunds
    FROM balance_transactions WHERE user_id = $1`, [userId]);
  const p = await queryOne<Record<string, string>>(`
    SELECT COUNT(*) AS orders, COALESCE(SUM(p.gb_amount),0) AS gb, MAX(p.created_at) AS last
    FROM purchases p JOIN customers c ON c.id = p.customer_id
    WHERE c.user_id = $1 AND p.status = 'completed'`, [userId]);
  return {
    deposited: n(r?.deposited), credits: n(r?.credits), spent: n(r?.spent), refunds: n(r?.refunds),
    orders: n(p?.orders), gbBought: n(p?.gb), lastPurchase: p?.last ?? null,
  };
}

export interface Tx {
  id: string; amount: number; type: 'credit' | 'debit'; reason: string;
  method: string; invoice: string | null; created_at: string;
}

export type TxFilter = 'all' | 'deposits' | 'purchases' | 'credits';

export async function getTransactions(userId: string, opts: { filter?: TxFilter; limit?: number; offset?: number } = {}) {
  const f = opts.filter ?? 'all';
  const where =
    f === 'deposits' ? `AND type='credit' AND payment_method IN ('stripe','crypto')`
    : f === 'purchases' ? `AND type='debit'`
    : f === 'credits' ? `AND type='credit' AND payment_method IN ('system','admin')`
    : '';
  const limit = Math.min(100, opts.limit ?? 25);
  const offset = Math.max(0, opts.offset ?? 0);
  const [rows, count] = await Promise.all([
    query<Record<string, string>>(
      `SELECT id, amount_usd, type, reason, payment_method, invoice_number, created_at
       FROM balance_transactions WHERE user_id = $1 ${where}
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    ),
    queryOne<{ c: string }>(`SELECT COUNT(*) AS c FROM balance_transactions WHERE user_id = $1 ${where}`, [userId]),
  ]);
  return {
    total: n(count?.c),
    rows: rows.map((r): Tx => ({
      id: r.id, amount: n(r.amount_usd), type: r.type as Tx['type'], reason: r.reason,
      method: r.payment_method, invoice: r.invoice_number, created_at: r.created_at,
    })),
  };
}

/** Money in vs money spent per day. */
export async function getMoneySeries(userId: string, days: number) {
  const rows = await query<Record<string, string>>(`
    WITH d AS (
      SELECT generate_series((now() AT TIME ZONE 'UTC')::date - ($2::int - 1), (now() AT TIME ZONE 'UTC')::date, interval '1 day')::date AS day
    )
    SELECT to_char(d.day,'YYYY-MM-DD') AS day,
      COALESCE(SUM(t.amount_usd) FILTER (WHERE t.type='credit' AND t.payment_method IN ('stripe','crypto')),0) AS added,
      COALESCE(SUM(t.amount_usd) FILTER (WHERE t.type='debit'),0) AS spent
    FROM d LEFT JOIN balance_transactions t
      ON t.user_id = $1 AND (t.created_at AT TIME ZONE 'UTC')::date = d.day
    GROUP BY d.day ORDER BY d.day`, [userId, days]);
  return rows.map((r) => ({ day: r.day, added: n(r.added), spent: n(r.spent) }));
}

/** Money added vs spent per calendar month (UTC), oldest first. */
export async function getMoneyMonthly(userId: string, months = 12) {
  const rows = await query<Record<string, string>>(`
    WITH m AS (
      SELECT generate_series(
        date_trunc('month', now() AT TIME ZONE 'UTC') - (($2::int - 1) * interval '1 month'),
        date_trunc('month', now() AT TIME ZONE 'UTC'),
        interval '1 month')::date AS month
    )
    SELECT to_char(m.month,'YYYY-MM-DD') AS day,
      COALESCE(SUM(t.amount_usd) FILTER (WHERE t.type='credit' AND t.payment_method IN ('stripe','crypto')),0) AS added,
      COALESCE(SUM(t.amount_usd) FILTER (WHERE t.type='debit'),0) AS spent
    FROM m LEFT JOIN balance_transactions t
      ON t.user_id = $1 AND date_trunc('month', t.created_at AT TIME ZONE 'UTC')::date = m.month
    GROUP BY m.month ORDER BY m.month`, [userId, months]);
  return rows.map((r) => ({ day: r.day, added: n(r.added), spent: n(r.spent) }));
}

export async function getNetwork(): Promise<PoolStock | null> {
  try {
    return await withTimeout(proxies().pool.getStock(), 5000);
  } catch {
    return null;
  }
}

export function proxyUsername(): string {
  return process.env.PROXIES_SX_USERNAME ?? '';
}
