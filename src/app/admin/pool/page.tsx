import { getPool } from '@/lib/admin-metrics';
import { COUNTRIES } from '@/lib/countries';
import { config } from '@/config';
import { Alert, Card, Empty, PageHeader, StatTile, Status, Td, Th } from '@/components/panel/ui';
import { ago, int } from '@/components/panel/format';

export default async function PoolPage() {
  const { stock, incidents, error } = await getPool();
  const offered = new Set<string>(config.countries);
  const codes = stock ? Array.from(new Set([...Object.keys(stock.pools.mbl), ...Object.keys(stock.pools.peer), ...offered])) : [];
  const rows = codes
    .map((code) => ({
      code,
      name: COUNTRIES.find((c) => c.code === code)?.name ?? code.toUpperCase(),
      flag: COUNTRIES.find((c) => c.code === code)?.flag ?? '',
      mbl: stock?.pools.mbl[code] ?? 0,
      peer: stock?.pools.peer[code] ?? 0,
      offered: offered.has(code),
    }))
    .sort((a, b) => b.mbl - a.mbl || b.peer - a.peer);
  const max = Math.max(1, ...rows.map((r) => r.mbl + r.peer));
  const offeredEmpty = rows.filter((r) => r.offered && r.mbl === 0);
  const open = incidents.filter((i) => !i.resolvedAt);

  return (
    <div>
      <PageHeader title="Proxy pool" subtitle={stock ? `Live endpoint counts from Proxies.sx · updated ${ago(stock.generatedAt)}` : 'Live endpoint counts from Proxies.sx'} />

      {error && <div className="mb-4"><Alert level="critical" title="Could not load pool stock">{error}</Alert></div>}
      {offeredEmpty.length > 0 && (
        <div className="mb-4">
          <Alert level="serious" title={`No mobile endpoints in ${offeredEmpty.map((r) => r.name).join(', ')}`}>
            These countries are advertised on the site. Customers routing there get a 502 until stock returns.
          </Alert>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Mobile endpoints" value={stock ? int(stock.totals.mbl) : '—'} />
        <StatTile label="Residential endpoints" value={stock ? int(stock.totals.peer) : '—'} />
        <StatTile label="Countries with mobile stock" value={stock ? int(rows.filter((r) => r.mbl > 0).length) : '—'} hint={`${int(offered.size)} advertised on the site`} />
        <StatTile label="Open incidents" value={int(open.length)} hint={incidents.length ? `${int(incidents.length - open.length)} resolved` : 'none reported'} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Endpoints by country" subtitle="Mobile and residential" className="xl:col-span-2">
          {rows.length === 0 ? <Empty>No stock data</Empty> : (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead><tr className="border-b border-[var(--color-border)]">
                  <Th className="pl-5">Country</Th><Th className="text-right">Mobile</Th><Th className="text-right">Residential</Th><Th className="w-2/5">Share</Th><Th className="pr-5">On site</Th>
                </tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.code} className="border-b border-[var(--color-border)] last:border-0">
                      <Td className="pl-5 text-[var(--color-text)]"><span aria-hidden className="mr-2">{r.flag}</span>{r.name} <span className="font-mono text-[10px] text-[var(--color-text-muted)]">{r.code}</span></Td>
                      <Td className="text-right tabular-nums text-[var(--color-text)]">{int(r.mbl)}</Td>
                      <Td className="text-right tabular-nums text-[var(--color-text)]">{int(r.peer)}</Td>
                      <Td>
                        <div className="flex h-2 gap-[2px]" title={`${r.mbl} mobile, ${r.peer} residential`}>
                          {r.mbl > 0 && <div className="h-full rounded-l-full bg-[var(--viz-1)]" style={{ width: `${(r.mbl / max) * 100}%`, borderRadius: r.peer > 0 ? '9999px 0 0 9999px' : '9999px' }} />}
                          {r.peer > 0 && <div className="h-full rounded-r-full bg-[var(--viz-2)]" style={{ width: `${(r.peer / max) * 100}%`, borderRadius: r.mbl > 0 ? '0 9999px 9999px 0' : '9999px' }} />}
                        </div>
                      </Td>
                      <Td className="pr-5">{r.offered ? (r.mbl > 0 ? <Status level="good">Live</Status> : <Status level="serious">Advertised, empty</Status>) : <Status level="neutral">Not listed</Status>}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="mt-3 flex gap-4 px-5 text-xs text-[var(--color-text-muted)]">
                <li className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-[var(--viz-1)]" />Mobile</li>
                <li className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-[var(--viz-2)]" />Residential</li>
              </ul>
            </div>
          )}
        </Card>

        <Card title="Provider incidents">
          {incidents.length === 0 ? <Empty>No incidents reported</Empty> : (
            <ul className="space-y-3">
              {incidents.map((i) => (
                <li key={i.id} className="rounded-xl border border-[var(--color-border)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Status level={i.resolvedAt ? 'good' : i.severity === 'critical' || i.severity === 'major' ? 'critical' : 'warning'}>
                      {i.resolvedAt ? 'Resolved' : i.severity}
                    </Status>
                    <span className="text-[11px] text-[var(--color-text-muted)]">{ago(i.startedAt)}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-[var(--color-text)]">{i.title}</p>
                  {i.description && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{i.description}</p>}
                  {i.affects?.length > 0 && <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">Affects: {i.affects.join(', ')}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
