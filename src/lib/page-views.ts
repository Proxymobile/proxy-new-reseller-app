import { query } from '@/lib/db';

/**
 * First-party page-view counter. Rows are aggregated per day/path/source/device;
 * nothing that identifies a visitor is stored.
 *
 * The table is created on first use so a deploy works without a manual
 * migration step (the same DDL lives in db/migrations/006_page_views.sql).
 */
let ready: Promise<void> | null = null;

export function ensurePageViewsTable(): Promise<void> {
  if (!ready) {
    ready = query(`
      CREATE TABLE IF NOT EXISTS page_views_daily (
        day     DATE    NOT NULL,
        path    TEXT    NOT NULL,
        source  TEXT    NOT NULL DEFAULT 'direct',
        device  TEXT    NOT NULL DEFAULT 'desktop' CHECK (device IN ('mobile', 'desktop')),
        views   INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (day, path, source, device)
      );
      CREATE INDEX IF NOT EXISTS idx_page_views_day ON page_views_daily(day DESC);
    `).then(() => undefined).catch((err) => {
      ready = null; // retry on the next call
      throw err;
    });
  }
  return ready;
}

export async function recordPageView(path: string, source: string, device: 'mobile' | 'desktop') {
  await ensurePageViewsTable();
  await query(
    `INSERT INTO page_views_daily (day, path, source, device, views)
     VALUES ((now() AT TIME ZONE 'UTC')::date, $1, $2, $3, 1)
     ON CONFLICT (day, path, source, device) DO UPDATE SET views = page_views_daily.views + 1`,
    [path, source, device],
  );
}
