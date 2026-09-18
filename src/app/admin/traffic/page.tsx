import { RANGES, parseRange, getTraffic, getFunnel } from '@/lib/admin-metrics';
import { BarList, Card, Delta, Empty, PageHeader, RangeTabs, StatTile, Td, Th } from '@/components/panel/ui';
import { TimeChart } from '@/components/panel/TimeChart';
import { Funnel } from '@/components/panel/Funnel';
import { int, pct } from '@/components/panel/format';

const VS: Record<string, string> = { '7d': 'vs prev. 7d', '30d': 'vs prev. 30d', '90d': 'vs prev. 90d', '365d': 'vs prev. 12 mo' };

function sourceLabel(s: string) {
  if (s === 'direct') return 'Direct / unknown';
  if (s.startsWith('utm:')) return `Campaign: ${s.slice(4)}`;
  return s;
}

export default async function TrafficPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const range = parseRange((await searchParams).range);
  const days = RANGES[range];
  const [t, funnel] = await Promise.all([getTraffic(days), getFunnel(days)]);

  const mobile = t.devices.find((d) => d.device === 'mobile')?.views ?? 0;
  const pagesPerVisit = t.entries ? t.views / t.entries : 0;
  const langOf = (p: string) => (p === '/zh' || p.startsWith('/zh/') ? '中文' : 'EN');

  return (
    <div>
      <PageHeader
        title="Site traffic"
        subtitle="First-party, cookieless page-view counts for public pages (bots and Do-Not-Track visitors excluded). Google Analytics has the full picture for visitors who allowed cookies."
      >
        <RangeTabs current={range} basePath="/admin/traffic" />
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Page views" value={int(t.views)} delta={<Delta current={t.views} previous={t.prevViews} label={VS[range]} />} />
        <StatTile label="Visits" value={int(t.entries)} delta={<Delta current={t.entries} previous={t.prevEntries} label={VS[range]} />} hint={`${pagesPerVisit.toFixed(1)} pages per visit`} />
        <StatTile label="Chinese pages (/zh)" value={int(t.zhViews)} hint={`${pct(t.views ? (t.zhViews / t.views) * 100 : 0)} of all views`} />
        <StatTile label="Mobile share" value={pct(t.views ? (mobile / t.views) * 100 : 0)} hint={`${int(mobile)} mobile · ${int(t.views - mobile)} desktop`} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Page views per day" subtitle="English and Chinese pages" className="xl:col-span-2">
          <TimeChart
            data={t.daily.map((d) => ({ day: d.day, en: d.en, zh: d.zh }))}
            series={[{ key: 'en', label: 'English', slot: 1 }, { key: 'zh', label: 'Chinese (/zh)', slot: 2 }]}
            stacked
            format="int"
            emptyNote="No page views recorded yet — counting starts after this deploy"
          />
        </Card>
        <Card title="Visits → customers" subtitle={`Last ${days} days`}>
          <Funnel steps={[
            { label: 'Visits', value: funnel.visits },
            { label: 'Sign-ups', value: funnel.signups },
            { label: 'Deposited money', value: funnel.deposited },
            { label: 'Bought bandwidth', value: funnel.purchased },
          ]} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Top pages" subtitle="Views and visits that started on the page" className="xl:col-span-2">
          {t.pages.length === 0 ? <Empty>No page views recorded yet</Empty> : (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead><tr className="border-b border-[var(--color-border)]">
                  <Th className="pl-5">Page</Th><Th>Lang</Th><Th className="text-right">Views</Th><Th className="text-right">Landings</Th><Th className="pr-5 text-right">Share</Th>
                </tr></thead>
                <tbody>
                  {t.pages.map((p) => (
                    <tr key={p.path} className="border-b border-[var(--color-border)] last:border-0">
                      <Td className="pl-5"><a href={p.path} target="_blank" rel="noreferrer" className="font-mono text-xs text-[var(--color-text)] hover:underline">{p.path}</a></Td>
                      <Td className="text-xs text-[var(--color-text-muted)]">{langOf(p.path)}</Td>
                      <Td className="text-right tabular-nums text-[var(--color-text)]">{int(p.views)}</Td>
                      <Td className="text-right tabular-nums text-[var(--color-text)]">{int(p.entries)}</Td>
                      <Td className="pr-5 text-right tabular-nums text-[var(--color-text-muted)]">{pct(t.views ? (p.views / t.views) * 100 : 0, 1)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <div className="space-y-4">
          <Card title="Where visits come from" subtitle="Referring site or utm_source tag">
            <BarList rows={t.sources.map((s) => ({ key: s.source, label: sourceLabel(s.source), value: s.views }))} format={int} empty="No visits recorded yet" />
          </Card>
          <Card title="Devices">
            <BarList rows={t.devices.map((d) => ({ key: d.device, label: d.device === 'mobile' ? 'Mobile' : 'Desktop', value: d.views }))} format={int} empty="No data yet" />
          </Card>
        </div>
      </div>
      <p className="mt-4 text-xs text-[var(--color-text-muted)]">
        Tip: add <code className="rounded bg-[var(--color-surface-hover)] px-1">?utm_source=reddit</code> (or any name) to ad and social links to see them as campaigns here.
      </p>
    </div>
  );
}
