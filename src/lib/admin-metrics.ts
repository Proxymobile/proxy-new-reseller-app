import { query, queryOne } from '@/lib/db';
import { proxies } from '@/lib/proxies';
import { ensurePageViewsTable } from '@/lib/page-views';
import { getUsageHistory, recordSnapshots } from '@/lib/usage-snapshots';
import type { PoolAccessKey, PoolStock, Incident } from '@proxies-sx/pool-sdk';

/**
 * Read-only metrics for the admin panel. Everything is computed in UTC days.
 *
 * Money definitions (keep these consistent across the panel):
 * - cash in     = real money received (Stripe / crypto credits)
 * - sales       = GB purchases paid from balance (purchases table)
 * - free credit = welcome bonus, promo and admin credits (not revenue)
 * - cost        = GB × ADMIN_COST_PER_GB (what the proxy provider charges you)
 */

// ─── Config ──────────────────────────────────────────────────

export interface CostInfo {
  /** Cost per GB converted to USD — used for every profit figure. */
  usd: number;
  /** Cost per GB as configured, in `currency`. */
  native: number;
  currency: 'USD' | 'EUR';
  /** EUR→USD rate used (1 for USD). */
  rate: number;
  /** ECB reference date of the rate, or 'fallback' when the live rate was unavailable. */
  rateDate: string | null;
}

// EUR→USD reference rate (ECB via frankfurter.dev), cached for 12 hours.
let fxCache: { rate: number; date: string; at: number } | null = null;

async function eurUsdRate(): Promise<{ rate: number; date: string }> {
  if (fxCache && Date.now() - fxCache.at < 12 * 3_600_000) return fxCache;
  try {
    const res = await withTimeout(
      fetch('https://api.frankfurter.dev/v1/latest?from=EUR&to=USD', { cache: 'no-store' }),
      4000,
    );
    const j = (await res.json()) as { date?: string; rates?: { USD?: number } };
    const rate = Number(j.rates?.USD);
    if (res.ok && Number.isFinite(rate) && rate > 0.5 && rate < 3) {
      fxCache = { rate, date: j.date ?? '', at: Date.now() };
      return fxCache;
    }
  } catch { /* fall through */ }
  if (fxCache) return fxCache; // stale beats nothing
  const fallback = Number(process.env.ADMIN_EUR_USD_FALLBACK);
  return { rate: Number.isFinite(fallback) && fallback > 0 ? fallback : 1.15, date: 'fallback' };
}

/**
 * Provider cost per GB from ADMIN_COST_PER_GB (+ ADMIN_COST_CURRENCY, USD or
 * EUR). Returns null when unset, which hides the profit figures.
 */
export async function getCost(): Promise<CostInfo | null> {
  const native = Number(process.env.ADMIN_COST_PER_GB);
  if (!Number.isFinite(native) || native <= 0) return null;
  const currency = (process.env.ADMIN_COST_CURRENCY ?? 'USD').trim().toUpperCase() === 'EUR' ? 'EUR' : 'USD';
  if (currency === 'USD') return { usd: native, native, currency, rate: 1, rateDate: null };
  const { rate, date } = await eurUsdRate();
  return { usd: native * rate, native, currency, rate, rateDate: date };
}

/** e.g. "€3.00/GB ≈ $3.46" or "$2.50/GB" */
export function describeCost(c: CostInfo): string {
  if (c.currency === 'USD') return `$${c.usd.toFixed(2)}/GB`;
  return `€${c.native.toFixed(2)}/GB ≈ $${c.usd.toFixed(2)}${c.rateDate === 'fallback' ? ' (approx. rate)' : ''}`;
}

export const RANGES = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 } as const;
export type RangeKey = keyof typeof RANGES;
export function parseRange(v: string | string[] | undefined): RangeKey {
  const s = Array.isArray(v) ? v[0] : v;
  return s && s in RANGES ? (s as RangeKey) : '30d';
}

const n = (v: unknown) => Number(v ?? 0) || 0;

/** Resolve a promise or give up after `ms`, so a slow upstream never hangs the panel. */
export async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      p,
      new Promise<T>((_, rej) => { t = setTimeout(() => rej(new Error(`timed out after ${ms}ms`)), ms); }),
    ]);
  } finally {
    if (t) clearTimeout(t);
  }
}

// ─── Business KPIs ───────────────────────────────────────────

export interface PeriodKpis {
  cashIn: number;
  sales: number;
  orders: number;
  gbSold: number;
  signups: number;
  newPayers: number;
  freeCredit: number;
  refunds: number;
  promoGb: number;
}

async function periodKpis(fromDaysAgo: number, toDaysAgo: number): Promise<PeriodKpis> {
  const row = await queryOne<Record<string, string>>(`
    WITH w AS (
      SELECT now() - ($1::int * interval '1 day') AS a, now() - ($2::int * interval '1 day') AS b
    )
    SELECT
      (SELECT COALESCE(SUM(amount_usd),0) FROM balance_transactions, w
        WHERE type='credit' AND payment_method IN ('stripe','crypto') AND created_at >= w.a AND created_at < w.b) AS cash_in,
      (SELECT COALESCE(SUM(price_usd),0) FROM purchases, w
        WHERE status='completed' AND created_at >= w.a AND created_at < w.b) AS sales,
      (SELECT COUNT(*) FROM purchases, w
        WHERE status='completed' AND created_at >= w.a AND created_at < w.b) AS orders,
      (SELECT COALESCE(SUM(gb_amount),0) FROM purchases, w
        WHERE status='completed' AND created_at >= w.a AND created_at < w.b) AS gb_sold,
      (SELECT COUNT(*) FROM users, w
        WHERE role='customer' AND created_at >= w.a AND created_at < w.b) AS signups,
      (SELECT COUNT(*) FROM (
         SELECT user_id, MIN(created_at) AS first_at FROM balance_transactions
          WHERE type='credit' AND payment_method IN ('stripe','crypto') GROUP BY user_id
       ) f, w WHERE f.first_at >= w.a AND f.first_at < w.b) AS new_payers,
      (SELECT COALESCE(SUM(amount_usd),0) FROM balance_transactions, w
        WHERE type='credit' AND (payment_method='admin' OR (payment_method='system' AND reason NOT LIKE 'Refund%'))
          AND created_at >= w.a AND created_at < w.b) AS free_credit,
      (SELECT COUNT(*) FROM balance_transactions, w
        WHERE type='credit' AND reason LIKE 'Refund%' AND created_at >= w.a AND created_at < w.b) AS refunds,
      (SELECT COALESCE(SUM(pc.grant_gb),0) FROM promo_redemptions pr JOIN promo_codes pc ON pc.id = pr.promo_id, w
        WHERE pc.grant_gb IS NOT NULL AND pr.created_at >= w.a AND pr.created_at < w.b) AS promo_gb
  `, [fromDaysAgo, toDaysAgo]);
  return {
    cashIn: n(row?.cash_in), sales: n(row?.sales), orders: n(row?.orders), gbSold: n(row?.gb_sold),
    signups: n(row?.signups), newPayers: n(row?.new_payers), freeCredit: n(row?.free_credit),
    refunds: n(row?.refunds), promoGb: n(row?.promo_gb),
  };
}

export async function getKpis(days: number) {
  const [current, previous] = await Promise.all([periodKpis(days, 0), periodKpis(days * 2, days)]);
  return { current, previous };
}

export interface Totals {
  cashIn: number; sales: number; gbSold: number; orders: number;
  customers: number; payingCustomers: number; buyers: number; repeatBuyers: number;
  outstandingBalance: number; freeCreditTotal: number; disabledAccounts: number;
  walletLinked: number; activeKeys: number;
}

export async function getTotals(): Promise<Totals> {
  const r = await queryOne<Record<string, string>>(`
    SELECT
      (SELECT COALESCE(SUM(amount_usd),0) FROM balance_transactions WHERE type='credit' AND payment_method IN ('stripe','crypto')) AS cash_in,
      (SELECT COALESCE(SUM(price_usd),0) FROM purchases WHERE status='completed') AS sales,
      (SELECT COALESCE(SUM(gb_amount),0) FROM purchases WHERE status='completed') AS gb_sold,
      (SELECT COUNT(*) FROM purchases WHERE status='completed') AS orders,
      (SELECT COUNT(*) FROM users WHERE role='customer') AS customers,
      (SELECT COUNT(DISTINCT user_id) FROM balance_transactions WHERE type='credit' AND payment_method IN ('stripe','crypto')) AS paying,
      (SELECT COUNT(DISTINCT customer_id) FROM purchases WHERE status='completed') AS buyers,
      (SELECT COUNT(*) FROM (SELECT customer_id FROM purchases WHERE status='completed' GROUP BY customer_id HAVING COUNT(*) >= 2) x) AS repeat_buyers,
      (SELECT COALESCE(SUM(balance_usd),0) FROM users WHERE role='customer') AS outstanding,
      (SELECT COALESCE(SUM(amount_usd),0) FROM balance_transactions
        WHERE type='credit' AND (payment_method='admin' OR (payment_method='system' AND reason NOT LIKE 'Refund%'))) AS free_credit,
      (SELECT COUNT(*) FROM users WHERE role='customer' AND NOT enabled) AS disabled,
      (SELECT COUNT(DISTINCT user_id) FROM wallet_links WHERE verified) AS wallets,
      (SELECT COUNT(*) FROM customers WHERE pak_key_id IS NOT NULL) AS keys
  `);
  return {
    cashIn: n(r?.cash_in), sales: n(r?.sales), gbSold: n(r?.gb_sold), orders: n(r?.orders),
    customers: n(r?.customers), payingCustomers: n(r?.paying), buyers: n(r?.buyers),
    repeatBuyers: n(r?.repeat_buyers), outstandingBalance: n(r?.outstanding),
    freeCreditTotal: n(r?.free_credit), disabledAccounts: n(r?.disabled),
    walletLinked: n(r?.wallets), activeKeys: n(r?.keys),
  };
}

export interface DailyPoint {
  day: string; cashIn: number; sales: number; gbSold: number; signups: number; orders: number;
}

export async function getDailySeries(days: number): Promise<DailyPoint[]> {
  const rows = await query<Record<string, string>>(`
    WITH d AS (
      SELECT generate_series((now() AT TIME ZONE 'UTC')::date - ($1::int - 1), (now() AT TIME ZONE 'UTC')::date, interval '1 day')::date AS day
    )
    SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
      COALESCE((SELECT SUM(amount_usd) FROM balance_transactions t
        WHERE t.type='credit' AND t.payment_method IN ('stripe','crypto') AND (t.created_at AT TIME ZONE 'UTC')::date = d.day),0) AS cash_in,
      COALESCE((SELECT SUM(price_usd) FROM purchases p WHERE p.status='completed' AND (p.created_at AT TIME ZONE 'UTC')::date = d.day),0) AS sales,
      COALESCE((SELECT SUM(gb_amount) FROM purchases p WHERE p.status='completed' AND (p.created_at AT TIME ZONE 'UTC')::date = d.day),0) AS gb_sold,
      (SELECT COUNT(*) FROM purchases p WHERE p.status='completed' AND (p.created_at AT TIME ZONE 'UTC')::date = d.day) AS orders,
      (SELECT COUNT(*) FROM users u WHERE u.role='customer' AND (u.created_at AT TIME ZONE 'UTC')::date = d.day) AS signups
    FROM d ORDER BY d.day
  `, [days]);
  return rows.map((r) => ({
    day: r.day, cashIn: n(r.cash_in), sales: n(r.sales), gbSold: n(r.gb_sold),
    signups: n(r.signups), orders: n(r.orders),
  }));
}

export async function getFunnel(days: number) {
  await ensurePageViewsTable();
  const r = await queryOne<Record<string, string>>(`
    WITH w AS (SELECT now() - ($1::int * interval '1 day') AS a),
    cohort AS (SELECT u.id FROM users u, w WHERE u.role='customer' AND u.created_at >= w.a)
    SELECT
      (SELECT COALESCE(SUM(views),0) FROM page_views_daily, w
        WHERE source <> 'internal' AND day >= (w.a AT TIME ZONE 'UTC')::date) AS visits,
      (SELECT COUNT(*) FROM cohort) AS signups,
      (SELECT COUNT(*) FROM cohort c WHERE EXISTS (
        SELECT 1 FROM balance_transactions t WHERE t.user_id = c.id AND t.type='credit' AND t.payment_method IN ('stripe','crypto'))) AS deposited,
      (SELECT COUNT(*) FROM cohort c WHERE EXISTS (
        SELECT 1 FROM purchases p JOIN customers cu ON cu.id = p.customer_id WHERE cu.user_id = c.id AND p.status='completed')) AS purchased,
      (SELECT COUNT(*) FROM cohort c WHERE EXISTS (
        SELECT 1 FROM promo_redemptions pr WHERE pr.user_id = c.id)) AS redeemed
  `, [days]);
  return {
    visits: n(r?.visits), signups: n(r?.signups), deposited: n(r?.deposited),
    purchased: n(r?.purchased), redeemed: n(r?.redeemed),
  };
}

export async function getPlanMix(days: number) {
  const rows = await query<Record<string, string>>(`
    SELECT
      CASE
        WHEN gb_amount <= 5 THEN '1–5 GB'
        WHEN gb_amount <= 10 THEN '6–10 GB'
        WHEN gb_amount <= 25 THEN '11–25 GB'
        WHEN gb_amount <= 50 THEN '26–50 GB'
        ELSE '51–100 GB'
      END AS bucket,
      MIN(gb_amount) AS sort_key,
      COUNT(*) AS orders, COALESCE(SUM(price_usd),0) AS revenue, COALESCE(SUM(gb_amount),0) AS gb
    FROM purchases
    WHERE status='completed' AND created_at >= now() - ($1::int * interval '1 day')
    GROUP BY 1 ORDER BY 2
  `, [days]);
  return rows.map((r) => ({ bucket: r.bucket, orders: n(r.orders), revenue: n(r.revenue), gb: n(r.gb) }));
}

export interface TopCustomer {
  id: string; label: string; email: string | null; created_at: string; enabled: boolean;
  paid: number; spent: number; gb: number; orders: number; balance: number; last_purchase: string | null;
  pak_key_id: string | null;
}

export async function getTopCustomers(limit = 10): Promise<TopCustomer[]> {
  const rows = await query<Record<string, string>>(`
    SELECT u.id, u.label, u.email, u.created_at, u.enabled, u.balance_usd,
      c.pak_key_id,
      COALESCE((SELECT SUM(amount_usd) FROM balance_transactions t WHERE t.user_id=u.id AND t.type='credit' AND t.payment_method IN ('stripe','crypto')),0) AS paid,
      COALESCE(SUM(p.price_usd) FILTER (WHERE p.status='completed'),0) AS spent,
      COALESCE(SUM(p.gb_amount) FILTER (WHERE p.status='completed'),0) AS gb,
      COUNT(p.id) FILTER (WHERE p.status='completed') AS orders,
      MAX(p.created_at) FILTER (WHERE p.status='completed') AS last_purchase
    FROM users u
    LEFT JOIN customers c ON c.user_id = u.id
    LEFT JOIN purchases p ON p.customer_id = c.id
    WHERE u.role='customer'
    GROUP BY u.id, c.pak_key_id
    ORDER BY paid DESC, spent DESC, u.created_at DESC
    LIMIT $1
  `, [limit]);
  return rows.map((r) => ({
    id: r.id, label: r.label, email: r.email, created_at: r.created_at,
    enabled: r.enabled as unknown as boolean, paid: n(r.paid), spent: n(r.spent), gb: n(r.gb),
    orders: n(r.orders), balance: n(r.balance_usd), last_purchase: r.last_purchase,
    pak_key_id: r.pak_key_id,
  }));
}

/** Customers holding credit they have not spent, or who signed up and never paid. */
export async function getOpportunities() {
  const [idleBalances, unpaidSignups] = await Promise.all([
    query<Record<string, string>>(`
      SELECT u.id, u.label, u.email, u.balance_usd,
        (SELECT MAX(created_at) FROM balance_transactions t WHERE t.user_id = u.id) AS last_tx
      FROM users u
      WHERE u.role='customer' AND u.enabled AND u.balance_usd >= 5
      ORDER BY u.balance_usd DESC LIMIT 8
    `),
    queryOne<Record<string, string>>(`
      SELECT COUNT(*) AS c FROM users u
      WHERE u.role='customer' AND u.created_at < now() - interval '1 day'
        AND NOT EXISTS (SELECT 1 FROM balance_transactions t WHERE t.user_id = u.id AND t.payment_method IN ('stripe','crypto'))
    `),
  ]);
  return {
    idleBalances: idleBalances.map((r) => ({ id: r.id, label: r.label, email: r.email, balance: n(r.balance_usd), lastTx: r.last_tx })),
    unpaidSignups: n(unpaidSignups?.c),
  };
}

// ─── Promos ──────────────────────────────────────────────────

export async function getPromoStats() {
  const rows = await query<Record<string, string>>(`
    SELECT pc.id, pc.code, pc.active, pc.expires_at, pc.max_redemptions, pc.redemption_count,
      pc.grant_gb, pc.credit_usd,
      COALESCE(SUM(pr.credited_usd),0) AS credited,
      MAX(pr.created_at) AS last_used,
      COUNT(DISTINCT pr.user_id) FILTER (WHERE EXISTS (
        SELECT 1 FROM balance_transactions t WHERE t.user_id = pr.user_id AND t.type='credit'
          AND t.payment_method IN ('stripe','crypto') AND t.created_at > pr.created_at)) AS converted,
      COALESCE(SUM((SELECT SUM(amount_usd) FROM balance_transactions t WHERE t.user_id = pr.user_id AND t.type='credit'
          AND t.payment_method IN ('stripe','crypto') AND t.created_at > pr.created_at)),0) AS cash_after
    FROM promo_codes pc
    LEFT JOIN promo_redemptions pr ON pr.promo_id = pc.id
    GROUP BY pc.id
    ORDER BY pc.redemption_count DESC, pc.created_at DESC
  `);
  return rows.map((r) => ({
    id: r.id, code: r.code, active: r.active as unknown as boolean, expiresAt: r.expires_at,
    max: r.max_redemptions === null ? null : n(r.max_redemptions), used: n(r.redemption_count),
    grantGb: r.grant_gb === null ? null : n(r.grant_gb), creditUsd: n(r.credit_usd),
    credited: n(r.credited), lastUsed: r.last_used, converted: n(r.converted), cashAfter: n(r.cash_after),
  }));
}

// ─── Security & ops ──────────────────────────────────────────

export async function getSecurity() {
  const [summary, topIps, webhooks] = await Promise.all([
    queryOne<Record<string, string>>(`
      SELECT
        COUNT(*) FILTER (WHERE success) AS ok,
        COUNT(*) FILTER (WHERE NOT success) AS failed,
        COUNT(DISTINCT ip_address) FILTER (WHERE NOT success) AS failed_ips
      FROM login_attempts WHERE attempted_at > now() - interval '24 hours'
    `),
    query<Record<string, string>>(`
      SELECT host(ip_address) AS ip, COUNT(*) AS c, MAX(attempted_at) AS last
      FROM login_attempts
      WHERE NOT success AND attempted_at > now() - interval '24 hours' AND ip_address IS NOT NULL
      GROUP BY ip_address ORDER BY c DESC LIMIT 5
    `),
    queryOne<Record<string, string>>(`
      SELECT COUNT(*) FILTER (WHERE processed_at > now() - interval '24 hours') AS day,
             MAX(processed_at) AS last
      FROM webhook_events
    `),
  ]);
  return {
    loginsOk: n(summary?.ok), loginsFailed: n(summary?.failed), failedIps: n(summary?.failed_ips),
    topFailedIps: topIps.map((r) => ({ ip: r.ip, count: n(r.c), last: r.last })),
    webhooks24h: n(webhooks?.day), lastWebhook: webhooks?.last ?? null,
  };
}

export async function getRecentActivity(limit = 12) {
  return query<{ id: string; action: string; actor: string | null; target_type: string | null; metadata: Record<string, unknown>; created_at: string }>(`
    SELECT a.id, a.action, u.label AS actor, a.target_type, a.metadata, a.created_at
    FROM audit_log a LEFT JOIN users u ON u.id = a.actor_id
    ORDER BY a.created_at DESC LIMIT $1
  `, [limit]);
}

// ─── Live provider data ──────────────────────────────────────

export interface LiveKey {
  id: string;
  label: string;
  enabled: boolean;
  capGb: number | null;
  usedGb: number;
  pct: number | null;
  expiresAt: string | null;
  expired: boolean;
  daysLeft: number | null;
  lastUsedAt: string | null;
  createdAt: number;
  user: { id: string; label: string; email: string | null; enabled: boolean } | null;
  flags: ('near_cap' | 'at_cap' | 'expiring' | 'expired' | 'disabled' | 'idle' | 'never_used')[];
}

export async function getLiveKeys(): Promise<{ keys: LiveKey[]; error: string | null }> {
  let raw: PoolAccessKey[];
  try {
    raw = await withTimeout(proxies().poolKeys.list(), 8000);
  } catch (e) {
    return { keys: [], error: e instanceof Error ? e.message : 'Provider unavailable' };
  }

  const owners = await query<{ pak_key_id: string; id: string; label: string; email: string | null; enabled: boolean }>(`
    SELECT c.pak_key_id, u.id, u.label, u.email, u.enabled
    FROM customers c JOIN users u ON u.id = c.user_id WHERE c.pak_key_id IS NOT NULL
  `);
  const byKey = new Map(owners.map((o) => [o.pak_key_id, o]));
  const now = Date.now();

  const keys: LiveKey[] = raw.map((k) => {
    const usedGb = (k.trafficUsedGB ?? k.trafficUsedMB / 1024) || 0;
    const capGb = k.trafficCapGB;
    const pct = capGb ? Math.min(100, (usedGb / capGb) * 100) : null;
    const exp = k.expiresAt ? Date.parse(k.expiresAt) : null;
    const expired = k.isExpired ?? (exp !== null && exp < now);
    const daysLeft = exp === null ? null : Math.ceil((exp - now) / 86_400_000);
    const last = k.lastUsedAt ? Date.parse(k.lastUsedAt) : null;
    const flags: LiveKey['flags'] = [];
    if (!k.enabled) flags.push('disabled');
    if (expired) flags.push('expired');
    else if (daysLeft !== null && daysLeft <= 7) flags.push('expiring');
    if (pct !== null && pct >= 100) flags.push('at_cap');
    else if (pct !== null && pct >= 80) flags.push('near_cap');
    if (last === null) flags.push('never_used');
    else if (now - last > 7 * 86_400_000) flags.push('idle');
    const owner = byKey.get(k.id);
    return {
      id: k.id, label: k.label, enabled: k.enabled, capGb, usedGb, pct,
      expiresAt: k.expiresAt, expired, daysLeft, lastUsedAt: k.lastUsedAt, createdAt: k.createdAt,
      user: owner ? { id: owner.id, label: owner.label, email: owner.email, enabled: owner.enabled } : null,
      flags,
    };
  });

  // Record today's usage per key so the panel can chart bandwidth over time.
  await recordSnapshots(keys);

  return { keys, error: null };
}

export { getUsageHistory };

export async function getPool(): Promise<{ stock: PoolStock | null; incidents: Incident[]; error: string | null }> {
  const [s, i] = await Promise.allSettled([
    withTimeout(proxies().pool.getStock(), 6000),
    withTimeout(proxies().pool.getIncidents(), 6000),
  ]);
  // allSettled protects against the call failing, but not against it
  // succeeding with a shape we did not expect. The upstream has returned a
  // non-array here (crashing /admin and /admin/pool on .filter), so treat
  // anything that is not an array as "no incidents" rather than trusting it.
  const incidents = i.status === 'fulfilled' && Array.isArray(i.value) ? i.value : [];
  return {
    stock: s.status === 'fulfilled' ? s.value : null,
    incidents,
    error: s.status === 'rejected' ? (s.reason instanceof Error ? s.reason.message : 'unavailable') : null,
  };
}

// ─── Site traffic ────────────────────────────────────────────

export async function getTraffic(days: number) {
  await ensurePageViewsTable();
  const params = [days];
  const since = `(now() AT TIME ZONE 'UTC')::date - ($1::int - 1)`;
  const [totals, prevTotals, daily, pages, sources, devices] = await Promise.all([
    queryOne<Record<string, string>>(`
      SELECT COALESCE(SUM(views),0) AS views,
             COALESCE(SUM(views) FILTER (WHERE source <> 'internal'),0) AS entries,
             COALESCE(SUM(views) FILTER (WHERE path = '/zh' OR path LIKE '/zh/%'),0) AS zh
      FROM page_views_daily WHERE day >= ${since}`, params),
    queryOne<Record<string, string>>(`
      SELECT COALESCE(SUM(views),0) AS views,
             COALESCE(SUM(views) FILTER (WHERE source <> 'internal'),0) AS entries
      FROM page_views_daily
      WHERE day >= (now() AT TIME ZONE 'UTC')::date - (2 * $1::int - 1) AND day < ${since}`, params),
    query<Record<string, string>>(`
      WITH d AS (SELECT generate_series(${since}, (now() AT TIME ZONE 'UTC')::date, interval '1 day')::date AS day)
      SELECT to_char(d.day,'YYYY-MM-DD') AS day,
        COALESCE(SUM(v.views) FILTER (WHERE NOT (v.path = '/zh' OR v.path LIKE '/zh/%')),0) AS en,
        COALESCE(SUM(v.views) FILTER (WHERE v.path = '/zh' OR v.path LIKE '/zh/%'),0) AS zh
      FROM d LEFT JOIN page_views_daily v ON v.day = d.day
      GROUP BY d.day ORDER BY d.day`, params),
    query<Record<string, string>>(`
      SELECT path, SUM(views) AS views, SUM(views) FILTER (WHERE source <> 'internal') AS entries
      FROM page_views_daily WHERE day >= ${since}
      GROUP BY path ORDER BY views DESC LIMIT 25`, params),
    query<Record<string, string>>(`
      SELECT source, SUM(views) AS views
      FROM page_views_daily WHERE day >= ${since} AND source <> 'internal'
      GROUP BY source ORDER BY views DESC LIMIT 15`, params),
    query<Record<string, string>>(`
      SELECT device, SUM(views) AS views FROM page_views_daily WHERE day >= ${since}
      GROUP BY device`, params),
  ]);
  return {
    views: n(totals?.views), entries: n(totals?.entries), zhViews: n(totals?.zh),
    prevViews: n(prevTotals?.views), prevEntries: n(prevTotals?.entries),
    daily: daily.map((r) => ({ day: r.day, en: n(r.en), zh: n(r.zh) })),
    pages: pages.map((r) => ({ path: r.path, views: n(r.views), entries: n(r.entries) })),
    sources: sources.map((r) => ({ source: r.source, views: n(r.views) })),
    devices: devices.map((r) => ({ device: r.device, views: n(r.views) })),
  };
}
