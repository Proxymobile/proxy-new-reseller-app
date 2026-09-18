import Link from 'next/link';
import {
  RANGES, parseRange, getCost, describeCost, getKpis, getTotals, getDailySeries, getFunnel, getPlanMix,
  getTopCustomers, getOpportunities, getPromoStats, getSecurity, getRecentActivity,
  getLiveKeys, getUsageHistory, getPool, getTraffic,
} from '@/lib/admin-metrics';
import { Alert, BarList, Card, Delta, Empty, PageHeader, RangeTabs, SectionTitle, StatTile, Status, Td, Th, Meter } from '@/components/panel/ui';
import { TimeChart } from '@/components/panel/TimeChart';
import { Funnel } from '@/components/panel/Funnel';
import { ago, gb, int, pct, usd } from '@/components/panel/format';

const RANGE_LABEL: Record<string, string> = { '7d': 'vs prev. 7d', '30d': 'vs prev. 30d', '90d': 'vs prev. 90d', '365d': 'vs prev. 12 mo' };

export default async function AdminOverview({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const range = parseRange((await searchParams).range);
  const days = RANGES[range];
  const vs = RANGE_LABEL[range];

  const [cost, kpis, totals, daily, funnel, planMix, top, opps, promos, security, activity, live, usage, pool, traffic] = await Promise.all([
    getCost(), getKpis(days), getTotals(), getDailySeries(days), getFunnel(days), getPlanMix(days),
    getTopCustomers(10), getOpportunities(), getPromoStats(), getSecurity(), getRecentActivity(12),
    getLiveKeys(), getUsageHistory(Math.min(days, 90)), getPool(), getTraffic(days),
  ]);
  const { current: c, previous: p } = kpis;

  // ── Live bandwidth summary
  const keys = live.keys;
  const usedTotal = keys.reduce((a, k) => a + k.usedGb, 0);
  const capTotal = keys.reduce((a, k) => a + (k.capGb ?? 0), 0);
  const active24h = keys.filter((k) => k.lastUsedAt && Date.now() - Date.parse(k.lastUsedAt) < 86_400_000).length;
  const count = (f: string) => keys.filter((k) => k.flags.includes(f as never)).length;
  const atCap = count('at_cap'), nearCap = count('near_cap'), expiring = count('expiring');
  const periodUsage = usage.series.reduce((a, s) => a + s.gb, 0);

  // ── Profit (GB sold × provider cost)
  const grossProfit = cost !== null ? c.sales - (c.gbSold + c.promoGb) * cost.usd : null;
  const prevProfit = cost !== null ? p.sales - (p.gbSold + p.promoGb) * cost.usd : null;
  const margin = cost !== null && c.sales > 0 ? (grossProfit! / c.sales) * 100 : null;

  // ── Alerts
  const alerts: { level: 'critical' | 'serious' | 'warning' | 'neutral'; title: string; body?: string; href?: string }[] = [];
  if (live.error) alerts.push({ level: 'critical', title: 'Proxies.sx API not reachable', body: `Live bandwidth and keys are unavailable: ${live.error}`, href: '/admin/pool' });
  for (const inc of pool.incidents.filter((i) => !i.resolvedAt)) {
    alerts.push({ level: inc.severity === 'critical' || inc.severity === 'major' ? 'critical' : 'warning', title: `Provider incident: ${inc.title}`, body: inc.affects?.join(', '), href: '/admin/pool' });
  }
  if (pool.stock?.totals?.mbl === 0) alerts.push({ level: 'critical', title: 'No mobile endpoints online', body: 'Customers cannot connect to the mobile pool right now.', href: '/admin/pool' });
  if (atCap) alerts.push({ level: 'serious', title: `${atCap} customer key${atCap > 1 ? 's' : ''} out of bandwidth`, body: 'These customers can no longer connect until they top up — a good moment to reach out.', href: '/admin/usage?filter=at_cap' });
  if (nearCap) alerts.push({ level: 'warning', title: `${nearCap} key${nearCap > 1 ? 's' : ''} above 80% of their bandwidth`, href: '/admin/usage?filter=near_cap' });
  if (expiring) alerts.push({ level: 'warning', title: `${expiring} key${expiring > 1 ? 's' : ''} expire within 7 days`, href: '/admin/usage?filter=expiring' });
  if (c.refunds > 0) alerts.push({ level: 'serious', title: `${c.refunds} purchase${c.refunds > 1 ? 's' : ''} refunded after a provider error`, body: 'Provisioning failed at Proxies.sx and the balance was returned.', href: '/admin/billing' });
  if (security.loginsFailed >= 20) alerts.push({ level: 'warning', title: `${security.loginsFailed} failed logins in 24h`, body: `From ${security.failedIps} IP address${security.failedIps === 1 ? '' : 'es'}.`, href: '/admin/audit' });
  if (cost === null) alerts.push({ level: 'neutral', title: 'Set ADMIN_COST_PER_GB to see profit and margin', body: 'Add what Proxies.sx charges you per GB (and ADMIN_COST_CURRENCY=EUR if it is in euros) to the server .env and redeploy.' });

  const topPages = traffic.pages.slice(0, 6);
  const conversion = funnel.signups ? (funnel.deposited / funnel.signups) * 100 : 0;

  return (
    <div>
      <PageHeader title="Overview" subtitle={`Everything that happened in the last ${days} days. Times in UTC.`}>
        <RangeTabs current={range} basePath="/admin" />
      </PageHeader>

      {alerts.length > 0 && (
        <div className="mb-6 grid gap-2 md:grid-cols-2">
          {alerts.map((a, i) => (
            <Alert key={i} level={a.level} title={a.title} href={a.href}>{a.body}</Alert>
          ))}
        </div>
      )}

      {/* ── Money ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Cash in" value={usd(c.cashIn)} delta={<Delta current={c.cashIn} previous={p.cashIn} label={vs} />} hint="Stripe & crypto deposits" href="/admin/billing" />
        <StatTile label="Sales" value={usd(c.sales)} delta={<Delta current={c.sales} previous={p.sales} label={vs} />} hint={`${int(c.orders)} orders · avg ${usd(c.orders ? c.sales / c.orders : 0)}`} />
        {grossProfit !== null ? (
          <StatTile label="Gross profit" value={usd(grossProfit)} delta={<Delta current={grossProfit} previous={prevProfit ?? 0} label={vs} />} hint={`${margin !== null ? `${pct(margin)} margin · ` : ''}cost ${describeCost(cost!)} incl. promo GB`} />
        ) : (
          <StatTile label="Gross profit" value="—" hint="Set ADMIN_COST_PER_GB to enable" />
        )}
        <StatTile label="GB sold" value={gb(c.gbSold)} delta={<Delta current={c.gbSold} previous={p.gbSold} label={vs} />} hint={c.promoGb ? `+ ${gb(c.promoGb)} given via promo trials` : 'from balance purchases'} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="New sign-ups" value={int(c.signups)} delta={<Delta current={c.signups} previous={p.signups} label={vs} />} href="/admin/accounts" />
        <StatTile label="New paying customers" value={int(c.newPayers)} delta={<Delta current={c.newPayers} previous={p.newPayers} label={vs} />} hint="first deposit in this period" />
        <StatTile label="Sign-up → paid" value={pct(conversion, conversion < 10 ? 1 : 0)} hint={`${int(funnel.deposited)} of ${int(funnel.signups)} new accounts have deposited`} />
        <StatTile label="Free credit given" value={usd(c.freeCredit)} delta={<Delta current={c.freeCredit} previous={p.freeCredit} goodWhenUp={false} label={vs} />} hint="bonus, promo & admin credits" href="/admin/promos" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card title="Cash in vs sales" subtitle="Per day, USD" className="xl:col-span-2">
          <TimeChart
            data={daily.map((d) => ({ day: d.day, cashIn: d.cashIn, sales: d.sales }))}
            series={[{ key: 'cashIn', label: 'Cash in', slot: 1 }, { key: 'sales', label: 'Sales', slot: 2 }]}
            kind={days > 30 ? 'line' : 'column'}
            format="usd"
          />
        </Card>
        <Card title="Conversion funnel" subtitle={`Visitors and accounts from the last ${days} days`}>
          <Funnel
            steps={[
              { label: 'Site visits', value: funnel.visits, note: 'entries from outside the site (first-party count)' },
              { label: 'Sign-ups', value: funnel.signups },
              { label: 'Deposited money', value: funnel.deposited },
              { label: 'Bought bandwidth', value: funnel.purchased },
            ]}
          />
          {funnel.redeemed > 0 && (
            <p className="mt-4 text-[11px] text-[var(--color-text-muted)]">{int(funnel.redeemed)} of these sign-ups redeemed a promo code.</p>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="New sign-ups" subtitle="Per day">
          <TimeChart data={daily.map((d) => ({ day: d.day, signups: d.signups }))} series={[{ key: 'signups', label: 'Sign-ups', slot: 1 }]} format="int" height={180} />
        </Card>
        <Card title="Bandwidth consumed" subtitle={usage.firstSnapshot ? `Per day · recorded since ${usage.firstSnapshot}` : 'Per day · recording starts today'}>
          <TimeChart
            data={usage.series.map((s) => ({ day: s.day, gb: s.gb }))}
            series={[{ key: 'gb', label: 'Used', slot: 1 }]}
            format="gb"
            height={180}
            emptyNote="History builds up each day the admin panel is opened"
          />
        </Card>
        <Card title="Order sizes" subtitle={`Last ${days} days`}>
          <BarList
            rows={planMix.map((m) => ({ key: m.bucket, label: m.bucket, value: m.revenue, sub: `${int(m.orders)} orders` }))}
            format={(v) => usd(v)}
            empty="No orders in this period"
          />
        </Card>
      </div>

      {/* ── Live service ── */}
      <SectionTitle href="/admin/usage" linkLabel="All keys">Live service</SectionTitle>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Bandwidth used (lifetime)" value={live.error ? '—' : gb(usedTotal)} hint={live.error ? 'provider unavailable' : `of ${gb(capTotal)} sold · ${pct(capTotal ? (usedTotal / capTotal) * 100 : 0)} used`} href="/admin/usage" />
        <StatTile label={`Consumed, last ${Math.min(days, 90)} days`} value={gb(periodUsage)} hint={cost !== null ? `≈ ${usd(periodUsage * cost.usd)} provider cost` : 'from daily snapshots'} />
        <StatTile label="Keys active in 24h" value={live.error ? '—' : `${int(active24h)} / ${int(keys.length)}`} hint={`${int(totals.activeKeys)} customers have a key`} href="/admin/usage?filter=active" />
        <StatTile
          label="Mobile endpoints online"
          value={pool.stock ? int(pool.stock.totals.mbl) : '—'}
          hint={pool.stock ? `${int(pool.stock.totals.peer)} residential · updated ${ago(pool.stock.generatedAt)}` : 'stock unavailable'}
          href="/admin/pool"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Top customers" subtitle="By money deposited, lifetime" className="xl:col-span-2" action={<Link href="/admin/accounts" className="text-[var(--color-primary)] hover:underline">All accounts →</Link>}>
          {top.length === 0 ? <Empty>No customers yet</Empty> : (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead><tr className="border-b border-[var(--color-border)]">
                  <Th className="pl-5">Customer</Th><Th className="text-right">Paid</Th><Th className="text-right">Spent</Th>
                  <Th className="text-right">GB</Th><Th className="text-right">Balance</Th><Th>Bandwidth</Th><Th className="pr-5">Last order</Th>
                </tr></thead>
                <tbody>
                  {top.map((t) => {
                    const k = keys.find((x) => x.id === t.pak_key_id);
                    return (
                      <tr key={t.id} className="border-b border-[var(--color-border)] last:border-0">
                        <Td className="pl-5">
                          <Link href={`/admin/accounts/${t.id}`} className="font-medium text-[var(--color-text)] hover:underline">{t.label}</Link>
                          <p className="text-[11px] text-[var(--color-text-muted)]">{t.email ?? `joined ${ago(t.created_at)}`}</p>
                        </Td>
                        <Td className="text-right tabular-nums text-[var(--color-text)]">{usd(t.paid)}</Td>
                        <Td className="text-right tabular-nums text-[var(--color-text)]">{usd(t.spent)}</Td>
                        <Td className="text-right tabular-nums text-[var(--color-text)]">{gb(t.gb)}</Td>
                        <Td className="text-right tabular-nums text-[var(--color-text)]">{usd(t.balance)}</Td>
                        <Td>{k ? <div><Meter value={k.usedGb} max={k.capGb} /><p className="mt-1 text-[11px] text-[var(--color-text-muted)]">{gb(k.usedGb)}{k.capGb ? ` / ${gb(k.capGb)}` : ''}</p></div> : <span className="text-[11px] text-[var(--color-text-muted)]">no key</span>}</Td>
                        <Td className="pr-5 text-xs text-[var(--color-text-muted)]">{t.last_purchase ? ago(t.last_purchase) : '—'}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Follow-up opportunities" subtitle="Customers worth a message">
          <p className="text-xs text-[var(--color-text-muted)]">Unspent balance of $5 or more</p>
          {opps.idleBalances.length === 0 ? <p className="mt-2 text-sm text-[var(--color-text-muted)]">None right now</p> : (
            <ul className="mt-2 space-y-2">
              {opps.idleBalances.map((o) => (
                <li key={o.id} className="flex items-baseline justify-between gap-2 text-sm">
                  <Link href={`/admin/accounts/${o.id}`} className="min-w-0 truncate text-[var(--color-text)] hover:underline">{o.label}</Link>
                  <span className="shrink-0 tabular-nums text-[var(--color-text)]">{usd(o.balance)} <span className="text-[11px] text-[var(--color-text-muted)]">· {ago(o.lastTx)}</span></span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 space-y-1.5 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-text-muted)]">
            <p><span className="font-semibold text-[var(--color-text)]">{int(opps.unpaidSignups)}</span> accounts older than a day never deposited</p>
            <p><span className="font-semibold text-[var(--color-text)]">{int(atCap)}</span> keys are out of bandwidth, <span className="font-semibold text-[var(--color-text)]">{int(nearCap)}</span> above 80%</p>
            <p><span className="font-semibold text-[var(--color-text)]">{int(expiring)}</span> keys expire within a week</p>
          </div>
        </Card>
      </div>

      {/* ── Lifetime ── */}
      <SectionTitle>Lifetime</SectionTitle>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Cash in" value={usd(totals.cashIn)} />
        <StatTile label="Sales" value={usd(totals.sales)} hint={`${int(totals.orders)} orders · ${gb(totals.gbSold)}`} />
        <StatTile label="Customer balances" value={usd(totals.outstandingBalance)} hint="credit owed as future bandwidth" />
        <StatTile label="Customers" value={int(totals.customers)} hint={`${int(totals.payingCustomers)} paying · ${int(totals.disabledAccounts)} disabled`} />
        <StatTile label="Repeat buyers" value={int(totals.repeatBuyers)} hint={`${pct(totals.buyers ? (totals.repeatBuyers / totals.buyers) * 100 : 0)} of ${int(totals.buyers)} buyers`} />
        <StatTile label="Avg. paid per payer" value={usd(totals.payingCustomers ? totals.cashIn / totals.payingCustomers : 0)} hint={`${int(totals.walletLinked)} with wallet 2FA`} />
      </div>

      {/* ── Growth ── */}
      <SectionTitle href={`/admin/traffic?range=${range}`} linkLabel="Traffic details">Website & promos</SectionTitle>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Site traffic" subtitle={`Page views, last ${days} days`}>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div>
              <p className="text-2xl font-semibold text-[var(--color-text)]">{int(traffic.views)}</p>
              <Delta current={traffic.views} previous={traffic.prevViews} label={vs} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--color-text)]">{int(traffic.entries)}</p>
              <p className="text-[11px] text-[var(--color-text-muted)]">visits · {pct(traffic.views ? (traffic.zhViews / traffic.views) * 100 : 0)} on /zh</p>
            </div>
          </div>
          <div className="mt-4">
            <BarList rows={topPages.map((pg) => ({ key: pg.path, label: pg.path, value: pg.views }))} format={int} empty="No page views recorded yet" />
          </div>
        </Card>

        <Card title="Promo codes" subtitle="Redemptions and what they turned into" className="xl:col-span-2" action={<Link href="/admin/promos" className="text-[var(--color-primary)] hover:underline">Manage →</Link>}>
          {promos.length === 0 ? <Empty>No promo codes yet</Empty> : (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead><tr className="border-b border-[var(--color-border)]">
                  <Th className="pl-5">Code</Th><Th>Status</Th><Th className="text-right">Used</Th>
                  <Th className="text-right">Became paying</Th><Th className="text-right">Cash after</Th><Th className="pr-5">Last used</Th>
                </tr></thead>
                <tbody>
                  {promos.slice(0, 8).map((pr) => {
                    const expired = pr.expiresAt && Date.parse(pr.expiresAt) < Date.now();
                    const full = pr.max !== null && pr.used >= pr.max;
                    return (
                      <tr key={pr.id} className="border-b border-[var(--color-border)] last:border-0">
                        <Td className="pl-5"><span className="font-mono text-xs font-semibold text-[var(--color-text)]">{pr.code}</span>
                          <p className="text-[11px] text-[var(--color-text-muted)]">{pr.grantGb ? `${pr.grantGb} GB trial` : `${usd(pr.creditUsd)} credit`}</p></Td>
                        <Td>{!pr.active ? <Status level="neutral">Paused</Status> : expired ? <Status level="neutral">Expired</Status> : full ? <Status level="warning">Used up</Status> : <Status level="good">Active</Status>}</Td>
                        <Td className="text-right tabular-nums text-[var(--color-text)]">{int(pr.used)}{pr.max !== null && <span className="text-[var(--color-text-muted)]"> / {int(pr.max)}</span>}</Td>
                        <Td className="text-right tabular-nums text-[var(--color-text)]">{int(pr.converted)} <span className="text-[11px] text-[var(--color-text-muted)]">({pct(pr.used ? (pr.converted / pr.used) * 100 : 0)})</span></Td>
                        <Td className="text-right tabular-nums text-[var(--color-text)]">{usd(pr.cashAfter)}</Td>
                        <Td className="pr-5 text-xs text-[var(--color-text-muted)]">{ago(pr.lastUsed)}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ── Security & activity ── */}
      <SectionTitle href="/admin/audit" linkLabel="Audit log">Security & activity</SectionTitle>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Logins, last 24 hours">
          <div className="flex gap-6">
            <div><p className="text-2xl font-semibold text-[var(--color-text)]">{int(security.loginsOk)}</p><p className="text-[11px] text-[var(--color-text-muted)]">successful</p></div>
            <div><p className="text-2xl font-semibold text-[var(--color-text)]">{int(security.loginsFailed)}</p><p className="text-[11px] text-[var(--color-text-muted)]">failed · {int(security.failedIps)} IPs</p></div>
          </div>
          {security.topFailedIps.length > 0 && (
            <ul className="mt-4 space-y-1.5 border-t border-[var(--color-border)] pt-3 text-xs">
              {security.topFailedIps.map((f) => (
                <li key={f.ip} className="flex justify-between gap-2">
                  <span className="font-mono text-[var(--color-text)]">{f.ip}</span>
                  <span className="text-[var(--color-text-muted)]">{int(f.count)} failed · {ago(f.last)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-text-muted)]">
            Stripe webhooks: <span className="font-semibold text-[var(--color-text)]">{int(security.webhooks24h)}</span> in 24h · last {ago(security.lastWebhook)}
          </p>
        </Card>

        <Card title="Recent activity" className="xl:col-span-2">
          {activity.length === 0 ? <Empty>No activity yet</Empty> : (
            <ul className="divide-y divide-[var(--color-border)]">
              {activity.map((a) => (
                <li key={a.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="font-medium text-[var(--color-text)]">{a.action.replace(/_/g, ' ')}</span>
                    <span className="text-[var(--color-text-muted)]"> · {a.actor ?? 'system'}</span>
                    {describe(a.metadata) && <span className="text-[var(--color-text-muted)]"> · {describe(a.metadata)}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-[var(--color-text-muted)]">{ago(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function describe(m: Record<string, unknown> | null): string {
  if (!m) return '';
  const parts: string[] = [];
  if (typeof m.amount === 'number') parts.push(usd(m.amount));
  if (typeof m.price === 'number') parts.push(usd(m.price));
  if (typeof m.gb === 'number') parts.push(gb(m.gb));
  if (typeof m.code === 'string') parts.push(m.code);
  return parts.join(' · ');
}
