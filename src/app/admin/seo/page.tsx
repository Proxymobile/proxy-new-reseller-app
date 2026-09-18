import { RANGES, parseRange } from '@/lib/admin-metrics';
import {
  getSeoTotals, getSeoSeries, getSeoRows, getTrackedKeywords, getSyncStatus,
  getPositionBands, getOpportunityQueries, auditPages,
} from '@/lib/seo-metrics';
import { SITE_URL } from '@/lib/seo';
import { Alert, BarList, Card, Delta, Empty, PageHeader, RangeTabs, StatTile, Status, Td, Th } from '@/components/panel/ui';
import { TimeChart } from '@/components/panel/TimeChart';
import { int, pct, ago } from '@/components/panel/format';
import { SyncButton } from './SyncButton';
import { KeywordManager, RemoveKeyword } from './KeywordManager';

const VS: Record<string, string> = { '7d': 'vs prev. 7d', '30d': 'vs prev. 30d', '90d': 'vs prev. 90d', '365d': 'vs prev. 12 mo' };

/** The pages worth auditing on every load: the money pages, EN and ZH. */
const AUDIT_PATHS = ['/', '/zh', '/mobile-proxy-api', '/mobile-proxies/us', '/mobile-proxies/gb'];

function positionLabel(p: number | null) {
  if (p === null || p === 0) return '—';
  return p.toFixed(1);
}

/** Movement in rank. Lower position is better, so a drop in number is a win. */
function Move({ current, previous }: { current: number | null; previous: number | null }) {
  if (current === null || previous === null || current === 0 || previous === 0) {
    return <span className="text-[11px] text-[var(--color-text-muted)]">—</span>;
  }
  const change = previous - current; // positive = moved up the page
  if (Math.abs(change) < 0.1) return <span className="text-[11px] text-[var(--color-text-muted)]">no change</span>;
  const up = change > 0;
  return (
    <span className={`text-[11px] font-semibold ${up ? 'text-[var(--viz-good-text)]' : 'text-[var(--viz-bad-text)]'}`}>
      <span aria-hidden>{up ? '▲' : '▼'}</span> {Math.abs(change).toFixed(1)}
    </span>
  );
}

function bandLevel(p: number | null) {
  if (p === null || p === 0) return 'neutral' as const;
  if (p <= 3) return 'good' as const;
  if (p <= 10) return 'good' as const;
  if (p <= 20) return 'warning' as const;
  return 'serious' as const;
}

export default async function SeoPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const range = parseRange((await searchParams).range);
  const days = RANGES[range];

  const [totals, series, queries, pages, keywords, sync, bands, opportunities, health] = await Promise.all([
    getSeoTotals(days),
    getSeoSeries(days),
    getSeoRows('query', days, 25),
    getSeoRows('page', days, 20),
    getTrackedKeywords(days),
    getSyncStatus(),
    getPositionBands(),
    getOpportunityQueries(10),
    auditPages(AUDIT_PATHS).catch(() => []),
  ]);

  const { current, previous } = totals;
  const prevCtr = previous.impressions ? (previous.clicks / previous.impressions) * 100 : 0;
  const healthProblems = health.reduce((n, p) => n + p.problems.length, 0);
  const trackedRanking = keywords.filter((k) => k.position !== null && k.position > 0);
  const avgTracked = trackedRanking.length
    ? trackedRanking.reduce((s, k) => s + (k.position ?? 0), 0) / trackedRanking.length
    : 0;

  return (
    <div>
      <PageHeader
        title="SEO"
        subtitle={
          <>
            Search Console performance for <span className="font-mono text-xs">{sync.siteUrl}</span>
            {sync.dataThrough ? <> · data through {sync.dataThrough}</> : null}
            {sync.lastSyncAt ? <> · synced {ago(sync.lastSyncAt)}</> : null}
          </>
        }
      >
        <RangeTabs current={range} basePath="/admin/seo" />
      </PageHeader>

      {!sync.configured && (
        <div className="mb-4">
          <Alert level="warning" title="Search Console is not connected">
            Add a Google service account with read access to <span className="font-mono">{sync.siteUrl}</span>, then set{' '}
            <code className="rounded bg-[var(--color-surface-hover)] px-1">GSC_SERVICE_ACCOUNT_JSON</code> (the key JSON) and{' '}
            <code className="rounded bg-[var(--color-surface-hover)] px-1">GSC_SITE_URL</code> in the environment. The on-page
            health check below works without it.
          </Alert>
        </div>
      )}

      {sync.configured && sync.lastStatus === 'error' && (
        <div className="mb-4">
          <Alert level="serious" title="Last Search Console sync failed">
            {sync.lastError ?? 'Unknown error'}
          </Alert>
        </div>
      )}

      <div className="mb-4">
        <SyncButton disabled={!sync.configured} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Clicks from search"
          value={int(current.clicks)}
          delta={<Delta current={current.clicks} previous={previous.clicks} label={VS[range]} />}
        />
        <StatTile
          label="Impressions"
          value={int(current.impressions)}
          delta={<Delta current={current.impressions} previous={previous.impressions} label={VS[range]} />}
        />
        <StatTile
          label="Average CTR"
          value={pct(current.ctr, 2)}
          delta={<Delta current={current.ctr} previous={prevCtr} label={VS[range]} />}
        />
        <StatTile
          label="Average position"
          value={current.position ? current.position.toFixed(1) : '—'}
          delta={<Delta current={current.position} previous={previous.position} goodWhenUp={false} label={VS[range]} />}
          hint="Lower is better"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Clicks and impressions per day" subtitle="Google organic search" className="xl:col-span-2">
          <TimeChart
            data={series.map((d) => ({ day: d.day, clicks: d.clicks, impressions: d.impressions }))}
            series={[{ key: 'impressions', label: 'Impressions', slot: 2 }, { key: 'clicks', label: 'Clicks', slot: 1 }]}
            kind="line"
            format="int"
            emptyNote={sync.configured ? 'No Search Console data cached yet — run a sync' : 'Connect Search Console to see this'}
          />
        </Card>
        <div className="space-y-4">
          <Card title="Where queries rank" subtitle="Queries with impressions, by position band">
            <BarList
              rows={bands.map((b) => ({ key: b.band, label: `Position ${b.band}`, value: b.count }))}
              format={int}
              empty="No query data yet"
            />
          </Card>
          <Card title="On-page health" subtitle={`${AUDIT_PATHS.length} key pages checked live`}>
            {health.length === 0 ? <Empty>Could not reach {SITE_URL}</Empty> : (
              <div className="space-y-2">
                <p className="text-sm text-[var(--color-text)]">
                  {healthProblems === 0
                    ? 'No issues found.'
                    : `${healthProblems} issue${healthProblems === 1 ? '' : 's'} across ${health.filter((p) => p.problems.length).length} page${health.filter((p) => p.problems.length).length === 1 ? '' : 's'}.`}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">Full list below.</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ---- Tracked keywords ---- */}
      <div className="mt-4">
        <Card
          title="Tracked keywords"
          subtitle={
            trackedRanking.length
              ? `${trackedRanking.length} of ${keywords.length} ranking · average position ${avgTracked.toFixed(1)}`
              : 'Keywords you want to win. Positions fill in from Search Console once they get impressions.'
          }
          action={<KeywordManager />}
        >
          {keywords.length === 0 ? (
            <Empty>No keywords tracked yet — add the terms you are targeting</Empty>
          ) : (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead><tr className="border-b border-[var(--color-border)]">
                  <Th className="pl-5">Keyword</Th>
                  <Th>Priority</Th>
                  <Th>Target page</Th>
                  <Th className="text-right">Position</Th>
                  <Th className="text-right">Move</Th>
                  <Th className="text-right">Impressions</Th>
                  <Th className="text-right">Clicks</Th>
                  <Th className="pr-5 text-right">Actions</Th>
                </tr></thead>
                <tbody>
                  {keywords.map((k) => (
                    <tr key={k.id} className="border-b border-[var(--color-border)] last:border-0">
                      <Td className="pl-5 text-[var(--color-text)]">{k.keyword}</Td>
                      <Td>
                        <Status level={k.priority === 'high' ? 'warning' : 'neutral'}>{k.priority}</Status>
                      </Td>
                      <Td className="text-xs">
                        {k.targetPath ? (
                          <a href={k.targetPath} target="_blank" rel="noreferrer" className="font-mono text-[var(--color-text-muted)] hover:underline">{k.targetPath}</a>
                        ) : <span className="text-[var(--color-text-muted)]">—</span>}
                      </Td>
                      <Td className="text-right">
                        <span className="tabular-nums text-[var(--color-text)]">{positionLabel(k.position)}</span>
                      </Td>
                      <Td className="text-right"><Move current={k.position} previous={k.prevPosition} /></Td>
                      <Td className="text-right tabular-nums text-[var(--color-text-muted)]">{int(k.impressions)}</Td>
                      <Td className="text-right tabular-nums text-[var(--color-text)]">{int(k.clicks)}</Td>
                      <Td className="pr-5 text-right"><RemoveKeyword id={k.id} keyword={k.keyword} /></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ---- Opportunities ---- */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card
          title="Quick wins"
          subtitle="Ranking 9–25 with real impressions — closest to page one"
        >
          {opportunities.length === 0 ? <Empty>No near-miss queries yet</Empty> : (
            <div className="space-y-2">
              {opportunities.map((o) => (
                <div key={o.value} className="flex items-baseline justify-between gap-3 border-b border-[var(--color-border)] pb-2 last:border-0 last:pb-0">
                  <span className="min-w-0 truncate text-sm text-[var(--color-text)]" title={o.value}>{o.value}</span>
                  <span className="shrink-0 text-xs tabular-nums text-[var(--color-text-muted)]">
                    #{o.position.toFixed(1)} · {int(o.impressions)} impr.
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Top queries" subtitle="By impressions in the latest snapshot" className="xl:col-span-2">
          {queries.length === 0 ? <Empty>No query data yet — run a sync</Empty> : (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead><tr className="border-b border-[var(--color-border)]">
                  <Th className="pl-5">Query</Th>
                  <Th className="text-right">Position</Th>
                  <Th className="text-right">Move</Th>
                  <Th className="text-right">Impressions</Th>
                  <Th className="text-right">Clicks</Th>
                  <Th className="pr-5 text-right">CTR</Th>
                </tr></thead>
                <tbody>
                  {queries.map((q) => (
                    <tr key={q.value} className="border-b border-[var(--color-border)] last:border-0">
                      <Td className="pl-5 text-[var(--color-text)]">{q.value}</Td>
                      <Td className="text-right tabular-nums text-[var(--color-text)]">{q.position.toFixed(1)}</Td>
                      <Td className="text-right"><Move current={q.position} previous={q.prevPosition} /></Td>
                      <Td className="text-right tabular-nums text-[var(--color-text-muted)]">{int(q.impressions)}</Td>
                      <Td className="text-right tabular-nums text-[var(--color-text)]">{int(q.clicks)}</Td>
                      <Td className="pr-5 text-right tabular-nums text-[var(--color-text-muted)]">{pct(q.ctr, 1)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ---- Pages ---- */}
      <div className="mt-4">
        <Card title="Top landing pages" subtitle="Pages Google sends search traffic to">
          {pages.length === 0 ? <Empty>No page data yet — run a sync</Empty> : (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead><tr className="border-b border-[var(--color-border)]">
                  <Th className="pl-5">Page</Th>
                  <Th className="text-right">Position</Th>
                  <Th className="text-right">Impressions</Th>
                  <Th className="text-right">Clicks</Th>
                  <Th className="pr-5 text-right">CTR</Th>
                </tr></thead>
                <tbody>
                  {pages.map((p) => {
                    const path = p.value.startsWith(SITE_URL) ? p.value.slice(SITE_URL.length) || '/' : p.value;
                    return (
                      <tr key={p.value} className="border-b border-[var(--color-border)] last:border-0">
                        <Td className="pl-5">
                          <a href={p.value} target="_blank" rel="noreferrer" className="font-mono text-xs text-[var(--color-text)] hover:underline">{path}</a>
                        </Td>
                        <Td className="text-right tabular-nums text-[var(--color-text)]">{p.position.toFixed(1)}</Td>
                        <Td className="text-right tabular-nums text-[var(--color-text-muted)]">{int(p.impressions)}</Td>
                        <Td className="text-right tabular-nums text-[var(--color-text)]">{int(p.clicks)}</Td>
                        <Td className="pr-5 text-right tabular-nums text-[var(--color-text-muted)]">{pct(p.ctr, 1)}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ---- On-page audit ---- */}
      <div className="mt-4">
        <Card title="On-page audit" subtitle="Live check of titles, descriptions, headings, canonicals and structured data">
          {health.length === 0 ? <Empty>Could not reach the site</Empty> : (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead><tr className="border-b border-[var(--color-border)]">
                  <Th className="pl-5">Page</Th>
                  <Th>Status</Th>
                  <Th>Title</Th>
                  <Th className="text-right">Desc.</Th>
                  <Th className="text-right">H1</Th>
                  <Th>Schema</Th>
                  <Th className="pr-5">Issues</Th>
                </tr></thead>
                <tbody>
                  {health.map((p) => (
                    <tr key={p.path} className="border-b border-[var(--color-border)] align-top last:border-0">
                      <Td className="pl-5">
                        <a href={p.path} target="_blank" rel="noreferrer" className="font-mono text-xs text-[var(--color-text)] hover:underline">{p.path}</a>
                      </Td>
                      <Td>
                        <Status level={p.status === 200 && p.indexable ? 'good' : 'critical'}>
                          {p.status ?? 'error'}{p.indexable ? '' : ' noindex'}
                        </Status>
                      </Td>
                      <Td className="text-xs text-[var(--color-text-muted)]">
                        <span className="block max-w-[240px] truncate" title={p.title ?? ''}>{p.title ?? '—'}</span>
                        <span className="tabular-nums">{p.titleLength} chars</span>
                      </Td>
                      <Td className="text-right tabular-nums text-xs text-[var(--color-text-muted)]">{p.descriptionLength || '—'}</Td>
                      <Td className="text-right tabular-nums text-xs text-[var(--color-text-muted)]">{p.h1Count}</Td>
                      <Td><Status level={p.hasJsonLd ? 'good' : 'warning'}>{p.hasJsonLd ? 'JSON-LD' : 'none'}</Status></Td>
                      <Td className="pr-5 text-xs text-[var(--color-text-muted)]">
                        {p.problems.length === 0 ? <span className="text-[var(--viz-good-text)]">None</span> : (
                          <ul className="space-y-0.5">
                            {p.problems.map((problem) => <li key={problem}>· {problem}</li>)}
                          </ul>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <p className="mt-4 text-xs text-[var(--color-text-muted)]">
        Search Console data lags Google by about two days, and query-level rows are sampled — treat positions as directional.
        Query and page snapshots are stored per sync, so movement compares the latest sync against the one nearest {days} days earlier.
      </p>
    </div>
  );
}
