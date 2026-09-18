import Link from 'next/link';
import { getCost, getLiveKeys, getUsageHistory, type LiveKey } from '@/lib/admin-metrics';
import { Alert, Card, Empty, Meter, PageHeader, StatTile, Status, Td, Th, type Level } from '@/components/panel/ui';
import { TimeChart } from '@/components/panel/TimeChart';
import { ago, gb, int, pct, usd } from '@/components/panel/format';

const FILTERS = [
  ['all', 'All'],
  ['active', 'Active 24h'],
  ['at_cap', 'Out of bandwidth'],
  ['near_cap', 'Above 80%'],
  ['expiring', 'Expiring ≤7d'],
  ['expired', 'Expired'],
  ['idle', 'Idle 7d+'],
  ['never_used', 'Never used'],
  ['disabled', 'Disabled'],
  ['unlinked', 'No account'],
] as const;
type Filter = (typeof FILTERS)[number][0];

const SORTS = [['used', 'Most used'], ['pct', 'Fullest'], ['last', 'Last active'], ['expires', 'Expiring soonest'], ['new', 'Newest']] as const;
type Sort = (typeof SORTS)[number][0];

const FLAG_UI: Record<LiveKey['flags'][number], [Level, string]> = {
  at_cap: ['critical', 'Out of bandwidth'],
  near_cap: ['serious', 'Above 80%'],
  expired: ['neutral', 'Expired'],
  expiring: ['warning', 'Expiring'],
  disabled: ['neutral', 'Disabled'],
  idle: ['neutral', 'Idle'],
  never_used: ['neutral', 'Never used'],
};

function matches(k: LiveKey, f: Filter) {
  if (f === 'all') return true;
  if (f === 'active') return !!k.lastUsedAt && Date.now() - Date.parse(k.lastUsedAt) < 86_400_000;
  if (f === 'unlinked') return !k.user;
  return k.flags.includes(f);
}

export default async function UsagePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const filter = (FILTERS.find(([k]) => k === sp.filter)?.[0] ?? 'all') as Filter;
  const sort = (SORTS.find(([k]) => k === sp.sort)?.[0] ?? 'used') as Sort;
  const q = typeof sp.q === 'string' ? sp.q.trim().toLowerCase() : '';
  const [{ keys, error }, usage, cost] = await Promise.all([getLiveKeys(), getUsageHistory(30), getCost()]);

  const used = keys.reduce((a, k) => a + k.usedGb, 0);
  const cap = keys.reduce((a, k) => a + (k.capGb ?? 0), 0);
  const remaining = keys.filter((k) => k.enabled && !k.expired).reduce((a, k) => a + Math.max(0, (k.capGb ?? 0) - k.usedGb), 0);
  const last7 = usage.series.slice(-7).reduce((a, s) => a + s.gb, 0);

  const rows = keys
    .filter((k) => matches(k, filter))
    .filter((k) => !q || [k.label, k.user?.label, k.user?.email, k.id].some((s) => s?.toLowerCase().includes(q)))
    .sort((a, b) => {
      if (sort === 'pct') return (b.pct ?? -1) - (a.pct ?? -1);
      if (sort === 'last') return (b.lastUsedAt ? Date.parse(b.lastUsedAt) : 0) - (a.lastUsedAt ? Date.parse(a.lastUsedAt) : 0);
      if (sort === 'expires') return (a.expiresAt ? Date.parse(a.expiresAt) : Infinity) - (b.expiresAt ? Date.parse(b.expiresAt) : Infinity);
      if (sort === 'new') return b.createdAt - a.createdAt;
      return b.usedGb - a.usedGb;
    });

  const href = (next: Partial<{ filter: string; sort: string; q: string }>) => {
    const p = new URLSearchParams();
    const f = next.filter ?? filter, s = next.sort ?? sort, qq = next.q ?? q;
    if (f !== 'all') p.set('filter', f);
    if (s !== 'used') p.set('sort', s);
    if (qq) p.set('q', qq);
    const str = p.toString();
    return `/admin/usage${str ? `?${str}` : ''}`;
  };

  return (
    <div>
      <PageHeader title="Bandwidth & keys" subtitle="Live from Proxies.sx. Opening this page also records today's usage for the history chart." />

      {error && <div className="mb-4"><Alert level="critical" title="Could not load keys from Proxies.sx">{error}</Alert></div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Used, lifetime" value={gb(used)} hint={`${pct(cap ? (used / cap) * 100 : 0)} of ${gb(cap)} sold`} />
        <StatTile label="Still available to customers" value={gb(remaining)} hint={cost !== null ? `≈ ${usd(remaining * cost.usd)} future provider cost` : 'on enabled, unexpired keys'} />
        <StatTile label="Consumed, last 7 days" value={gb(last7)} hint={`≈ ${gb(last7 / 7)} per day`} />
        <StatTile label="Keys" value={int(keys.length)} hint={`${int(keys.filter((k) => matches(k, 'active')).length)} active in 24h · ${int(keys.filter((k) => !k.user).length)} without an account`} />
      </div>

      <div className="mt-4">
        <Card title="Bandwidth consumed per day" subtitle={usage.firstSnapshot ? `Last 30 days · recorded since ${usage.firstSnapshot}` : 'Recording starts today'}>
          <TimeChart
            data={usage.series.map((s) => ({ day: s.day, gb: s.gb }))}
            series={[{ key: 'gb', label: 'Used', slot: 1 }]}
            format="gb"
            height={200}
            emptyNote="History builds up each day the admin panel is opened"
          />
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {FILTERS.map(([k, label]) => {
          const c = keys.filter((x) => matches(x, k)).length;
          const on = filter === k;
          return (
            <Link
              key={k}
              href={href({ filter: k })}
              aria-current={on ? 'page' : undefined}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                on ? 'border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-bg)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {label} <span className="tabular-nums opacity-70">{c}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <form action="/admin/usage" className="flex gap-2">
          {filter !== 'all' && <input type="hidden" name="filter" value={filter} />}
          {sort !== 'used' && <input type="hidden" name="sort" value={sort} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search customer, email or key id"
            className="w-64 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
          />
          <button className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text)]">Search</button>
        </form>
        <div className="flex flex-wrap items-center gap-1 text-xs text-[var(--color-text-muted)]">
          Sort:
          {SORTS.map(([k, label]) => (
            <Link key={k} href={href({ sort: k })} className={`rounded-md px-2 py-1 ${sort === k ? 'bg-[var(--color-surface-hover)] font-medium text-[var(--color-text)]' : 'hover:text-[var(--color-text)]'}`}>{label}</Link>
          ))}
        </div>
      </div>

      <div className="viz mt-3 overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        {rows.length === 0 ? <Empty>{error ? 'No data' : 'No keys match this filter'}</Empty> : (
          <table className="w-full min-w-[860px] text-sm">
            <thead><tr className="border-b border-[var(--color-border)]">
              <Th className="pl-5">Customer</Th><Th>Used</Th><Th className="text-right">Left</Th>
              <Th>Expires</Th><Th>Last active</Th><Th className="pr-5">Status</Th>
            </tr></thead>
            <tbody>
              {rows.map((k) => (
                <tr key={k.id} className="border-b border-[var(--color-border)] last:border-0">
                  <Td className="pl-5">
                    {k.user ? (
                      <Link href={`/admin/accounts/${k.user.id}`} className="font-medium text-[var(--color-text)] hover:underline">{k.user.label}</Link>
                    ) : (
                      <span className="font-medium text-[var(--color-text)]">{k.label}</span>
                    )}
                    <p className="font-mono text-[10px] text-[var(--color-text-muted)]">{k.user?.email ?? k.id}</p>
                  </Td>
                  <Td>
                    <Meter value={k.usedGb} max={k.capGb} />
                    <p className="mt-1 text-[11px] tabular-nums text-[var(--color-text-muted)]">
                      {gb(k.usedGb)}{k.capGb ? ` of ${gb(k.capGb)} · ${pct(k.pct ?? 0)}` : ' · no cap'}
                    </p>
                  </Td>
                  <Td className="text-right tabular-nums text-[var(--color-text)]">{k.capGb ? gb(Math.max(0, k.capGb - k.usedGb)) : '∞'}</Td>
                  <Td className="text-xs text-[var(--color-text-muted)]">
                    {k.expiresAt ? (
                      <>
                        <span className="text-[var(--color-text)]">{new Date(k.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        <span> · {k.expired ? 'expired' : `${k.daysLeft}d left`}</span>
                      </>
                    ) : 'never'}
                  </Td>
                  <Td className="text-xs text-[var(--color-text-muted)]">{ago(k.lastUsedAt)}</Td>
                  <Td className="pr-5">
                    <div className="flex flex-wrap gap-1">
                      {k.flags.length === 0 ? <Status level="good">Healthy</Status> : k.flags.map((f) => (
                        <Status key={f} level={FLAG_UI[f][0]}>{FLAG_UI[f][1]}</Status>
                      ))}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-2 text-xs text-[var(--color-text-muted)]">Showing {int(rows.length)} of {int(keys.length)} keys.</p>
    </div>
  );
}
