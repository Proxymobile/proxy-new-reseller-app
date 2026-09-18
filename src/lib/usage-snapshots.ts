import { query } from '@/lib/db';

/**
 * Daily usage snapshots per pool key. The provider only reports lifetime
 * usage, so we store the latest reading per key per UTC day and derive daily
 * consumption from the differences. Written whenever the admin panel or a
 * customer's dashboard loads live key data.
 */
let ready: Promise<void> | null = null;

export function ensureSnapshotTable(): Promise<void> {
  if (!ready) {
    ready = query(`
      CREATE TABLE IF NOT EXISTS usage_snapshots (
        day         DATE NOT NULL,
        key_id      TEXT NOT NULL,
        used_mb     NUMERIC(14,2) NOT NULL,
        cap_gb      NUMERIC(10,2),
        captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (day, key_id)
      );
    `).then(() => undefined).catch((e) => { ready = null; throw e; });
  }
  return ready;
}

export async function recordSnapshots(keys: { id: string; usedGb: number; capGb: number | null }[]) {
  if (!keys.length) return;
  try {
    await ensureSnapshotTable();
    await query(
      `INSERT INTO usage_snapshots (day, key_id, used_mb, cap_gb)
       SELECT (now() AT TIME ZONE 'UTC')::date, k.id, k.used_mb, k.cap_gb
       FROM unnest($1::text[], $2::numeric[], $3::numeric[]) AS k(id, used_mb, cap_gb)
       ON CONFLICT (day, key_id) DO UPDATE SET used_mb = EXCLUDED.used_mb, cap_gb = EXCLUDED.cap_gb, captured_at = now()`,
      [keys.map((k) => k.id), keys.map((k) => +(k.usedGb * 1024).toFixed(2)), keys.map((k) => k.capGb)],
    );
  } catch (e) {
    console.error('[usage] snapshot failed:', e instanceof Error ? e.message : e);
  }
}

/**
 * Bandwidth consumed per day for the last `days` days — all keys, or one key.
 * Gaps between snapshot days are spread evenly; resets clamp at zero.
 */
export async function getUsageHistory(days: number, keyId?: string) {
  await ensureSnapshotTable();
  const rows = await query<{ day: string; used_mb: string }>(
    `SELECT to_char(day, 'YYYY-MM-DD') AS day, SUM(used_mb) AS used_mb
     FROM usage_snapshots
     WHERE day >= (now() AT TIME ZONE 'UTC')::date - ($1::int + 1)
       AND ($2::text IS NULL OR key_id = $2)
     GROUP BY day ORDER BY day`,
    [days + 60, keyId ?? null],
  );
  const num = (v: unknown) => Number(v ?? 0) || 0;
  const byDay = new Map<string, number>();
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1];
    const cur = rows[i];
    const gap = Math.max(1, Math.round((Date.parse(cur.day) - Date.parse(prev.day)) / 86_400_000));
    const delta = Math.max(0, num(cur.used_mb) - num(prev.used_mb)) / 1024 / gap;
    for (let g = 0; g < gap; g++) {
      const d = new Date(Date.parse(cur.day) - g * 86_400_000).toISOString().slice(0, 10);
      byDay.set(d, delta);
    }
  }
  const out: { day: string; gb: number }[] = [];
  const today = Date.parse(new Date().toISOString().slice(0, 10));
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today - i * 86_400_000).toISOString().slice(0, 10);
    out.push({ day: d, gb: byDay.get(d) ?? 0 });
  }
  return { series: out, firstSnapshot: rows[0]?.day ?? null };
}
