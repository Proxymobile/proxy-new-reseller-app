import { query, queryOne } from '@/lib/db';
import { gscQuery, isGscConfigured, isoDaysAgo, gscSiteUrl } from '@/lib/gsc';
import { SITE_URL } from '@/lib/seo';

/**
 * SEO tracker data layer.
 *
 * Search Console data is *cached* in seo_daily rather than queried live: GSC
 * is rate-limited and slow, its data lags ~2 days, and the panel needs to
 * render fast. `syncSearchConsole` refills the cache; every read below is a
 * plain SQL query against it.
 */

let ready: Promise<void> | null = null;

/** Creates the SEO tables on first use so a deploy works without a manual migrate. */
export function ensureSeoTables(): Promise<void> {
  if (!ready) {
    ready = query(`
      CREATE TABLE IF NOT EXISTS seo_daily (
        day          DATE    NOT NULL,
        dimension    TEXT    NOT NULL CHECK (dimension IN ('site', 'query', 'page')),
        value        TEXT    NOT NULL,
        clicks       INTEGER NOT NULL DEFAULT 0,
        impressions  INTEGER NOT NULL DEFAULT 0,
        position     NUMERIC(6,2) NOT NULL DEFAULT 0,
        PRIMARY KEY (day, dimension, value)
      );
      CREATE INDEX IF NOT EXISTS idx_seo_daily_day ON seo_daily(day DESC);
      CREATE INDEX IF NOT EXISTS idx_seo_daily_dim ON seo_daily(dimension, day DESC);

      CREATE TABLE IF NOT EXISTS seo_keywords (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        keyword     TEXT NOT NULL,
        target_path TEXT,
        priority    TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
        notes       TEXT,
        created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_seo_keywords_kw ON seo_keywords(lower(keyword));

      CREATE TABLE IF NOT EXISTS seo_sync_log (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        finished_at  TIMESTAMPTZ,
        status       TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'ok', 'error')),
        rows_synced  INTEGER NOT NULL DEFAULT 0,
        days_synced  INTEGER NOT NULL DEFAULT 0,
        error        TEXT,
        triggered_by UUID REFERENCES users(id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS idx_seo_sync_started ON seo_sync_log(started_at DESC);
    `).then(() => undefined).catch((err) => {
      ready = null; // retry on the next call
      throw err;
    });
  }
  return ready;
}

// ---------------------------------------------------------------------------
// Sync
// ---------------------------------------------------------------------------

/**
 * Pulls the last `days` days from Search Console into seo_daily.
 *
 * Three passes, because GSC aggregates differently per dimension set and the
 * panel needs all three: site totals per day, query totals, page totals.
 * Query/page rows are stored against the *end* of the window (not per day) —
 * per-day-per-query rows explode in size and GSC heavily samples them.
 */
export async function syncSearchConsole(opts: { days?: number; triggeredBy?: string } = {}) {
  await ensureSeoTables();
  const days = Math.min(Math.max(opts.days ?? 90, 7), 480);

  const log = await queryOne<{ id: string }>(
    'INSERT INTO seo_sync_log (triggered_by, days_synced) VALUES ($1, $2) RETURNING id',
    [opts.triggeredBy ?? null, days],
  );
  const logId = log?.id ?? null;

  try {
    if (!isGscConfigured()) {
      throw new Error('Search Console is not configured. Set GSC_SERVICE_ACCOUNT_JSON and GSC_SITE_URL.');
    }

    // GSC data is final ~2 days back; ask from 1 day back so partial data still shows.
    const endDate = isoDaysAgo(1);
    const startDate = isoDaysAgo(days);
    let rowsSynced = 0;

    // 1. Daily site totals.
    const daily = await gscQuery({ startDate, endDate, dimensions: ['date'], rowLimit: 500 });
    for (const r of daily) {
      await query(
        `INSERT INTO seo_daily (day, dimension, value, clicks, impressions, position)
         VALUES ($1, 'site', '', $2, $3, $4)
         ON CONFLICT (day, dimension, value)
         DO UPDATE SET clicks = EXCLUDED.clicks, impressions = EXCLUDED.impressions, position = EXCLUDED.position`,
        [r.keys[0], Math.round(r.clicks), Math.round(r.impressions), r.position.toFixed(2)],
      );
      rowsSynced++;
    }

    // 2. Query totals for the window, stamped on the window's end date.
    const queries = await gscQuery({ startDate, endDate, dimensions: ['query'], rowLimit: 2000 });
    for (const r of queries) {
      await query(
        `INSERT INTO seo_daily (day, dimension, value, clicks, impressions, position)
         VALUES ($1, 'query', $2, $3, $4, $5)
         ON CONFLICT (day, dimension, value)
         DO UPDATE SET clicks = EXCLUDED.clicks, impressions = EXCLUDED.impressions, position = EXCLUDED.position`,
        [endDate, r.keys[0], Math.round(r.clicks), Math.round(r.impressions), r.position.toFixed(2)],
      );
      rowsSynced++;
    }

    // 3. Page totals for the window.
    const pages = await gscQuery({ startDate, endDate, dimensions: ['page'], rowLimit: 2000 });
    for (const r of pages) {
      await query(
        `INSERT INTO seo_daily (day, dimension, value, clicks, impressions, position)
         VALUES ($1, 'page', $2, $3, $4, $5)
         ON CONFLICT (day, dimension, value)
         DO UPDATE SET clicks = EXCLUDED.clicks, impressions = EXCLUDED.impressions, position = EXCLUDED.position`,
        [endDate, r.keys[0], Math.round(r.clicks), Math.round(r.impressions), r.position.toFixed(2)],
      );
      rowsSynced++;
    }

    if (logId) {
      await query(
        "UPDATE seo_sync_log SET finished_at = now(), status = 'ok', rows_synced = $2 WHERE id = $1",
        [logId, rowsSynced],
      );
    }
    return { ok: true as const, rowsSynced, days, startDate, endDate };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (logId) {
      await query(
        "UPDATE seo_sync_log SET finished_at = now(), status = 'error', error = $2 WHERE id = $1",
        [logId, message.slice(0, 500)],
      ).catch(() => {});
    }
    return { ok: false as const, error: message, days };
  }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export interface SeoTotals {
  clicks: number;
  impressions: number;
  position: number;
  ctr: number;
}

const ZERO: SeoTotals = { clicks: 0, impressions: 0, position: 0, ctr: 0 };

function toTotals(row: { clicks: string | null; impressions: string | null; position: string | null } | null): SeoTotals {
  const clicks = Number(row?.clicks ?? 0);
  const impressions = Number(row?.impressions ?? 0);
  return {
    clicks,
    impressions,
    position: Number(row?.position ?? 0),
    ctr: impressions ? (clicks / impressions) * 100 : 0,
  };
}

/** Site totals for the period and the one before it (for deltas). */
export async function getSeoTotals(days: number): Promise<{ current: SeoTotals; previous: SeoTotals }> {
  await ensureSeoTables();
  const sql = `
    SELECT SUM(clicks) AS clicks,
           SUM(impressions) AS impressions,
           CASE WHEN SUM(impressions) > 0
                THEN SUM(position * impressions) / SUM(impressions)
                ELSE 0 END AS position
    FROM seo_daily
    WHERE dimension = 'site' AND day > (CURRENT_DATE - $1::int) AND day <= (CURRENT_DATE - $2::int)
  `;
  const [current, previous] = await Promise.all([
    queryOne<{ clicks: string; impressions: string; position: string }>(sql, [days, 0]),
    queryOne<{ clicks: string; impressions: string; position: string }>(sql, [days * 2, days]),
  ]);
  return { current: toTotals(current) ?? ZERO, previous: toTotals(previous) ?? ZERO };
}

export interface SeoDayPoint { day: string; clicks: number; impressions: number; position: number }

export async function getSeoSeries(days: number): Promise<SeoDayPoint[]> {
  await ensureSeoTables();
  const rows = await query<{ day: Date; clicks: number; impressions: number; position: string }>(
    `SELECT day, clicks, impressions, position
     FROM seo_daily
     WHERE dimension = 'site' AND day > (CURRENT_DATE - $1::int)
     ORDER BY day ASC`,
    [days],
  );
  return rows.map((r) => ({
    day: r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day).slice(0, 10),
    clicks: Number(r.clicks),
    impressions: Number(r.impressions),
    position: Number(r.position),
  }));
}

export interface SeoRow {
  value: string;
  clicks: number;
  impressions: number;
  position: number;
  ctr: number;
  prevPosition: number | null;
}

/**
 * Top queries or pages from the most recent synced snapshot, with the position
 * from the snapshot closest to one period earlier so movement is visible.
 */
export async function getSeoRows(dimension: 'query' | 'page', days: number, limit = 25): Promise<SeoRow[]> {
  await ensureSeoTables();
  const rows = await query<{
    value: string; clicks: number; impressions: number; position: string; prev_position: string | null;
  }>(
    `WITH latest AS (
       SELECT MAX(day) AS day FROM seo_daily WHERE dimension = $1
     ),
     prev AS (
       SELECT MAX(day) AS day FROM seo_daily
       WHERE dimension = $1 AND day <= (SELECT day FROM latest) - $2::int
     )
     SELECT s.value, s.clicks, s.impressions, s.position,
            p.position AS prev_position
     FROM seo_daily s
     LEFT JOIN seo_daily p
       ON p.dimension = $1 AND p.value = s.value AND p.day = (SELECT day FROM prev)
     WHERE s.dimension = $1 AND s.day = (SELECT day FROM latest)
     ORDER BY s.impressions DESC, s.clicks DESC
     LIMIT $3`,
    [dimension, days, limit],
  );
  return rows.map((r) => {
    const impressions = Number(r.impressions);
    return {
      value: r.value,
      clicks: Number(r.clicks),
      impressions,
      position: Number(r.position),
      ctr: impressions ? (Number(r.clicks) / impressions) * 100 : 0,
      prevPosition: r.prev_position === null ? null : Number(r.prev_position),
    };
  });
}

export interface TrackedKeyword {
  id: string;
  keyword: string;
  targetPath: string | null;
  priority: 'high' | 'normal' | 'low';
  notes: string | null;
  /** Null when Search Console has no data for this query yet. */
  position: number | null;
  prevPosition: number | null;
  clicks: number;
  impressions: number;
  /** The page GSC shows ranking for this query, when it can be inferred. */
  rankingPage: string | null;
}

export async function getTrackedKeywords(days: number): Promise<TrackedKeyword[]> {
  await ensureSeoTables();
  const rows = await query<{
    id: string; keyword: string; target_path: string | null; priority: string; notes: string | null;
    position: string | null; prev_position: string | null; clicks: number | null; impressions: number | null;
  }>(
    `WITH latest AS (SELECT MAX(day) AS day FROM seo_daily WHERE dimension = 'query'),
     prev AS (
       SELECT MAX(day) AS day FROM seo_daily
       WHERE dimension = 'query' AND day <= (SELECT day FROM latest) - $1::int
     )
     SELECT k.id, k.keyword, k.target_path, k.priority, k.notes,
            c.position, c.clicks, c.impressions,
            p.position AS prev_position
     FROM seo_keywords k
     LEFT JOIN seo_daily c
       ON c.dimension = 'query' AND lower(c.value) = lower(k.keyword) AND c.day = (SELECT day FROM latest)
     LEFT JOIN seo_daily p
       ON p.dimension = 'query' AND lower(p.value) = lower(k.keyword) AND p.day = (SELECT day FROM prev)
     ORDER BY
       CASE k.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,
       c.impressions DESC NULLS LAST,
       k.keyword ASC`,
    [days],
  );

  return rows.map((r) => ({
    id: r.id,
    keyword: r.keyword,
    targetPath: r.target_path,
    priority: (r.priority as 'high' | 'normal' | 'low') ?? 'normal',
    notes: r.notes,
    position: r.position === null ? null : Number(r.position),
    prevPosition: r.prev_position === null ? null : Number(r.prev_position),
    clicks: Number(r.clicks ?? 0),
    impressions: Number(r.impressions ?? 0),
    rankingPage: null,
  }));
}

export interface SyncStatus {
  configured: boolean;
  siteUrl: string;
  lastSyncAt: string | null;
  lastStatus: 'running' | 'ok' | 'error' | null;
  lastError: string | null;
  rowsSynced: number;
  /** Most recent day present in the cache — GSC lags ~2 days behind. */
  dataThrough: string | null;
}

export async function getSyncStatus(): Promise<SyncStatus> {
  await ensureSeoTables();
  const [last, through] = await Promise.all([
    queryOne<{ started_at: Date; status: string; error: string | null; rows_synced: number }>(
      'SELECT started_at, status, error, rows_synced FROM seo_sync_log ORDER BY started_at DESC LIMIT 1',
      [],
    ),
    queryOne<{ day: Date | null }>("SELECT MAX(day) AS day FROM seo_daily WHERE dimension = 'site'", []),
  ]);

  return {
    configured: isGscConfigured(),
    siteUrl: gscSiteUrl(),
    lastSyncAt: last?.started_at ? new Date(last.started_at).toISOString() : null,
    lastStatus: (last?.status as SyncStatus['lastStatus']) ?? null,
    lastError: last?.error ?? null,
    rowsSynced: Number(last?.rows_synced ?? 0),
    dataThrough: through?.day ? new Date(through.day).toISOString().slice(0, 10) : null,
  };
}

/**
 * Buckets the tracked-keyword set by ranking band. The bands matter because
 * the work each implies is different: 1–3 is defend, 4–10 is push, 11–20 is
 * the page-two gap worth the most traffic, 21+ needs new content or links.
 */
export async function getPositionBands(): Promise<{ band: string; count: number }[]> {
  await ensureSeoTables();
  const rows = await query<{ band: string; count: string }>(
    `WITH latest AS (SELECT MAX(day) AS day FROM seo_daily WHERE dimension = 'query')
     SELECT CASE
              WHEN position <= 3  THEN '1–3'
              WHEN position <= 10 THEN '4–10'
              WHEN position <= 20 THEN '11–20'
              WHEN position <= 50 THEN '21–50'
              ELSE '51+'
            END AS band,
            COUNT(*) AS count
     FROM seo_daily
     WHERE dimension = 'query' AND day = (SELECT day FROM latest) AND impressions > 0
     GROUP BY 1`,
    [],
  );
  const order = ['1–3', '4–10', '11–20', '21–50', '51+'];
  const map = new Map(rows.map((r) => [r.band, Number(r.count)]));
  return order.map((band) => ({ band, count: map.get(band) ?? 0 }));
}

/**
 * Queries where the site ranks on page 2 with real impressions — the highest
 * leverage SEO work available, since a small push lands them on page 1.
 */
export async function getOpportunityQueries(limit = 12): Promise<SeoRow[]> {
  await ensureSeoTables();
  const rows = await query<{ value: string; clicks: number; impressions: number; position: string }>(
    `WITH latest AS (SELECT MAX(day) AS day FROM seo_daily WHERE dimension = 'query')
     SELECT value, clicks, impressions, position
     FROM seo_daily
     WHERE dimension = 'query' AND day = (SELECT day FROM latest)
       AND position > 8 AND position <= 25 AND impressions >= 10
     ORDER BY impressions DESC
     LIMIT $1`,
    [limit],
  );
  return rows.map((r) => {
    const impressions = Number(r.impressions);
    return {
      value: r.value,
      clicks: Number(r.clicks),
      impressions,
      position: Number(r.position),
      ctr: impressions ? (Number(r.clicks) / impressions) * 100 : 0,
      prevPosition: null,
    };
  });
}

// ---------------------------------------------------------------------------
// On-page health
// ---------------------------------------------------------------------------

export interface PageHealth {
  path: string;
  status: number | null;
  title: string | null;
  titleLength: number;
  description: string | null;
  descriptionLength: number;
  h1Count: number;
  canonical: string | null;
  hasJsonLd: boolean;
  hasHreflang: boolean;
  indexable: boolean;
  problems: string[];
}

function extract(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

/**
 * Fetches a handful of the site's own pages and checks the on-page basics.
 * Deliberately shallow and self-hosted — it catches the regressions that break
 * rankings silently (a lost canonical, a missing description, a stray noindex)
 * without a third-party crawler.
 */
export async function auditPages(paths: string[]): Promise<PageHealth[]> {
  const results = await Promise.all(paths.map(async (path): Promise<PageHealth> => {
    const base: PageHealth = {
      path, status: null, title: null, titleLength: 0, description: null, descriptionLength: 0,
      h1Count: 0, canonical: null, hasJsonLd: false, hasHreflang: false, indexable: true, problems: [],
    };

    try {
      const res = await fetch(`${SITE_URL}${path}`, {
        headers: { 'User-Agent': 'ProxyMobile-SEO-Audit/1.0' },
        signal: AbortSignal.timeout(8_000),
        // On-page markup changes only on deploy, so a 15-minute cache keeps
        // the panel fast without ever showing meaningfully stale results.
        next: { revalidate: 900, tags: ['seo-audit'] },
      });
      base.status = res.status;
      if (!res.ok) {
        base.problems.push(`Returns HTTP ${res.status}`);
        return base;
      }

      const html = await res.text();
      base.title = extract(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
      base.titleLength = base.title?.length ?? 0;
      base.description = extract(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
        ?? extract(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
      base.descriptionLength = base.description?.length ?? 0;
      base.h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;
      base.canonical = extract(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);
      base.hasJsonLd = /application\/ld\+json/i.test(html);
      base.hasHreflang = /hreflang=/i.test(html);
      base.indexable = !/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);

      if (!base.indexable) base.problems.push('Marked noindex');
      if (!base.title) base.problems.push('No <title>');
      else if (base.titleLength > 62) base.problems.push(`Title ${base.titleLength} chars — truncates in results`);
      else if (base.titleLength < 25) base.problems.push(`Title only ${base.titleLength} chars`);
      if (!base.description) base.problems.push('No meta description');
      else if (base.descriptionLength > 160) base.problems.push(`Description ${base.descriptionLength} chars — truncates`);
      else if (base.descriptionLength < 70) base.problems.push(`Description only ${base.descriptionLength} chars`);
      if (base.h1Count === 0) base.problems.push('No <h1>');
      else if (base.h1Count > 1) base.problems.push(`${base.h1Count} <h1> tags`);
      if (!base.canonical) base.problems.push('No canonical URL');
      if (!base.hasJsonLd) base.problems.push('No JSON-LD structured data');
    } catch (err) {
      base.problems.push(err instanceof Error ? `Fetch failed: ${err.message}` : 'Fetch failed');
    }

    return base;
  }));

  return results;
}
