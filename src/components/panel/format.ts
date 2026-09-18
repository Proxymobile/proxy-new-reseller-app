/** Formatting helpers shared by admin server and client components. */

export function usd(v: number, opts: { cents?: boolean } = {}): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? '−' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${sign}$${(abs / 1000).toFixed(1)}K`;
  const cents = opts.cents ?? abs < 1000;
  return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })}`;
}

export function int(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${(v / 1000).toFixed(1)}K`;
  return Math.round(v).toLocaleString('en-US');
}

export function gb(v: number): string {
  if (v === 0) return '0 GB';
  if (Math.abs(v) < 1) return `${Math.round(v * 1024)} MB`;
  return `${v >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(v >= 10 ? 1 : 2)} GB`;
}

export function pct(v: number, digits = 0): string {
  if (!Number.isFinite(v)) return '—';
  return `${v.toFixed(digits)}%`;
}

export function ago(iso: string | number | null | undefined): string {
  if (!iso) return 'never';
  const t = typeof iso === 'number' ? iso : Date.parse(iso);
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 0) {
    const f = -s;
    if (f < 3600) return `in ${Math.max(1, Math.round(f / 60))}m`;
    if (f < 86400) return `in ${Math.round(f / 3600)}h`;
    return `in ${Math.round(f / 86400)}d`;
  }
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 86400 * 60) return `${Math.round(s / 86400)}d ago`;
  return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function shortDate(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export type ValueFormat = 'usd' | 'int' | 'gb';
export function fmt(v: number, f: ValueFormat): string {
  return f === 'usd' ? usd(v) : f === 'gb' ? gb(v) : int(v);
}
