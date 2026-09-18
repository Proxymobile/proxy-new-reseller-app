import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { config } from '@/config';
import {
  getAccountUser, getCustomerKey, getKeyUsage, getMoneySummary, getTransactions, getNetwork, proxyUsername,
} from '@/lib/customer-data';
import { Alert, Card, Empty, Meter, PageHeader, StatTile, Status, type Level } from '@/components/panel/ui';
import { TimeChart } from '@/components/panel/TimeChart';
import { ago, gb, int, usd } from '@/components/panel/format';
import { countryInfo } from '@/lib/country-list';
import { customGbPrice, customGbRatePerGB, FIRST_TOPUP_BONUS_USD } from '@/lib/pricing';
import { QuickConnect } from './_components/QuickConnect';

export default async function DashboardOverview() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const uid = session.user.id;

  const [user, { key, error: keyError }, money, recent, stock] = await Promise.all([
    getAccountUser(uid), getCustomerKey(uid), getMoneySummary(uid), getTransactions(uid, { limit: 6 }), getNetwork(),
  ]);
  if (!user) redirect('/login');
  const usage = await getKeyUsage(key?.id ?? null, 30);
  const used30 = usage.series.reduce((a, s) => a + s.gb, 0);
  const avgPerDay = used30 / 30;
  const daysOfData = key?.leftGb != null && avgPerDay > 0.001 ? key.leftGb / avgPerDay : null;
  const gbAffordable = Math.floor(user.balance / customGbRatePerGB(1));

  const countries = [...config.countries]
    .map((code) => ({ code, online: stock?.pools.mbl[code] ?? 0 }))
    .sort((a, b) => b.online - a.online);

  // ── Key status
  let status: { level: Level; label: string } = { level: 'neutral', label: 'No key yet' };
  if (key) {
    if (key.expired) status = { level: 'critical', label: 'Expired' };
    else if (key.pct !== null && key.pct >= 100) status = { level: 'critical', label: 'Out of data' };
    else if (!key.enabled) status = { level: 'serious', label: 'Paused' };
    else status = { level: 'good', label: 'Active' };
  }

  // ── Alerts
  const alerts: { level: Level; title: string; body?: string; href?: string }[] = [];
  if (keyError) alerts.push({ level: 'serious', title: 'Live usage is temporarily unavailable', body: keyError });
  if (!user.enabled) alerts.push({ level: 'critical', title: 'Your account is disabled', body: `Contact ${config.brand.supportEmail} for help.`, href: '/dashboard/support' });
  if (key) {
    if (key.pct !== null && key.pct >= 100) {
      alerts.push({ level: 'critical', title: 'You are out of bandwidth', body: 'Your proxies stop working until you add more GB.', href: '/dashboard/purchase' });
    } else if (key.pct !== null && key.pct >= 85) {
      const d = daysOfData !== null ? Math.max(1, Math.round(daysOfData)) : null;
      alerts.push({ level: 'warning', title: `Only ${gb(key.leftGb ?? 0)} of data left`, body: d !== null ? `At your recent pace that lasts about ${d} day${d === 1 ? '' : 's'}.` : undefined, href: '/dashboard/purchase' });
    }
    if (key.expired) {
      alerts.push({ level: 'critical', title: 'Your bandwidth has expired', body: 'Buy any amount to reactivate your key — it extends the expiry by 30 days.', href: '/dashboard/purchase' });
    } else if (key.daysLeft !== null && key.daysLeft <= 7 && (key.leftGb ?? 1) > 0) {
      alerts.push({
        level: 'warning',
        title: `Your data expires in ${key.daysLeft} day${key.daysLeft === 1 ? '' : 's'}`,
        body: `Unused GB is lost after ${new Date(key.expiresAt!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}. Any top-up extends it by 30 days.`,
        href: '/dashboard/purchase',
      });
    }
    if (!key.enabled && !key.expired && (key.pct ?? 0) < 100) {
      alerts.push({ level: 'serious', title: 'Your key is paused', body: 'Connections are refused until you resume it.', href: '/dashboard/keys' });
    }
    if (user.balance < customGbPrice(1) && (key.pct ?? 0) >= 85) {
      alerts.push({ level: 'neutral', title: 'Add funds to keep going', body: `Your balance is ${usd(user.balance)}; 1 GB costs ${usd(customGbPrice(1))}.`, href: '/dashboard/billing' });
    }
  }

  const steps = [
    { done: money.deposited > 0 || user.balance > 0, title: 'Add funds', body: `Top up from $5. Your first deposit gets $${FIRST_TOPUP_BONUS_USD} extra.`, href: '/dashboard/billing', cta: 'Add funds' },
    { done: !!key, title: 'Buy bandwidth', body: 'Pick how many GB you need — from $5/GB at volume.', href: '/dashboard/purchase', cta: 'Buy bandwidth' },
    { done: !!key?.lastUsedAt, title: 'Send your first request', body: 'Copy a proxy URL and paste it into your tool or script.', href: '/dashboard/keys', cta: 'Get a proxy URL' },
  ];
  const onboarding = !keyError && steps.some((s) => !s.done);

  return (
    <div>
      <PageHeader title={`Hi, ${user.label}`} subtitle={key ? 'Your proxy account at a glance.' : 'Three steps and you are sending traffic through real mobile IPs.'}>
        <div className="flex gap-2">
          <Link href="/dashboard/purchase" className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]">
            Buy bandwidth
          </Link>
          <Link href="/dashboard/keys" className="rounded-lg bg-[var(--color-text)] px-3.5 py-2 text-sm font-semibold text-[var(--color-bg)] hover:opacity-90">
            Get proxy URL
          </Link>
        </div>
      </PageHeader>

      {alerts.length > 0 && (
        <div className="mb-6 grid gap-2 md:grid-cols-2">
          {alerts.map((a, i) => <Alert key={i} level={a.level} title={a.title} href={a.href}>{a.body}</Alert>)}
        </div>
      )}

      {onboarding && (
        <Card title="Get started" subtitle={`${steps.filter((s) => s.done).length} of ${steps.length} done`} className="mb-6">
          <ol className="grid gap-3 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className={`rounded-xl border p-4 ${s.done ? 'border-[var(--color-border)] opacity-70' : 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5'}`}>
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${s.done ? 'bg-[var(--viz-good)] text-white' : 'bg-[var(--color-text)] text-[var(--color-bg)]'}`}
                  >
                    {s.done ? '✓' : i + 1}
                  </span>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{s.title}{s.done && <span className="sr-only"> (done)</span>}</p>
                </div>
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">{s.body}</p>
                {!s.done && (
                  <Link href={s.href} className="mt-3 inline-block text-xs font-semibold text-[var(--color-primary)] hover:underline">{s.cta} →</Link>
                )}
              </li>
            ))}
          </ol>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Balance"
          value={usd(user.balance)}
          hint={gbAffordable >= 1 ? `buys about ${int(gbAffordable)} GB` : 'top up to buy bandwidth'}
          href="/dashboard/billing"
        />
        <StatTile
          label="Data left"
          value={key ? (key.capGb === null ? 'Unlimited' : gb(key.leftGb ?? 0)) : '—'}
          delta={key && key.capGb ? <div className="mt-1.5"><Meter value={key.usedGb} max={key.capGb} /></div> : undefined}
          hint={key ? (key.capGb ? `${gb(key.usedGb)} of ${gb(key.capGb)} used` : `${gb(key.usedGb)} used`) : 'buy bandwidth to get a key'}
          href="/dashboard/purchase"
        />
        <StatTile
          label="Used, last 30 days"
          value={key ? gb(used30) : '—'}
          hint={key ? (avgPerDay > 0 ? `≈ ${gb(avgPerDay)} per day${daysOfData !== null ? ` · lasts ~${Math.max(1, Math.round(daysOfData))} more days` : ''}` : 'no traffic recorded yet') : undefined}
        />
        <StatTile
          label="Expires"
          value={key?.expiresAt ? new Date(key.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : key ? 'Never' : '—'}
          hint={key?.expiresAt ? (key.expired ? 'expired — top up to reactivate' : `${key.daysLeft} days left · top-ups add 30 days`) : undefined}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        <Card
          title="Data used per day"
          subtitle={usage.firstSnapshot ? `Last 30 days · tracked since ${new Date(usage.firstSnapshot).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'Last 30 days · tracking starts today'}
          className="xl:col-span-3"
        >
          <TimeChart
            data={usage.series.map((s) => ({ day: s.day, gb: s.gb }))}
            series={[{ key: 'gb', label: 'Used', slot: 1 }]}
            format="gb"
            height={210}
            emptyNote={key ? 'Your daily usage appears here as you use your proxies' : 'Buy bandwidth to start tracking usage'}
          />
        </Card>

        <Card
          title="Connect now"
          subtitle={key ? 'Copy a working proxy in one click' : 'Available once you have bandwidth'}
          className="xl:col-span-2"
          action={key && <Status level={status.level}>{status.label}</Status>}
        >
          {key ? (
            <>
              <QuickConnect username={proxyUsername()} secret={key.secret} countries={countries} disabled={status.level !== 'good'} />
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--color-border)] pt-3 text-xs">
                <div><dt className="text-[var(--color-text-muted)]">Last request</dt><dd className="mt-0.5 font-medium text-[var(--color-text)]">{ago(key.lastUsedAt)}</dd></div>
                <div><dt className="text-[var(--color-text-muted)]">Key ID</dt><dd className="mt-0.5 truncate font-mono text-[var(--color-text)]">{key.id}</dd></div>
              </dl>
            </>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">You don&apos;t have a proxy key yet.</p>
              <Link href="/dashboard/purchase" className="mt-3 inline-block rounded-lg bg-[var(--color-text)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)]">Buy bandwidth</Link>
              <p className="mt-3 text-[11px] text-[var(--color-text-muted)]">Have a promo code? <Link href="/dashboard/billing#promo" className="text-[var(--color-primary)] hover:underline">Redeem it</Link></p>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Recent activity" action={<Link href="/dashboard/billing" className="text-[var(--color-primary)] hover:underline">All transactions →</Link>} className="xl:col-span-2">
          {recent.rows.length === 0 ? <Empty>No transactions yet</Empty> : (
            <ul className="divide-y divide-[var(--color-border)]">
              {recent.rows.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[var(--color-text)]">{t.reason}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">{ago(t.created_at)}{t.invoice ? ` · ${t.invoice}` : ''}</p>
                  </div>
                  <span className={`shrink-0 text-sm font-semibold tabular-nums ${t.type === 'credit' ? 'text-[var(--viz-good-text)]' : 'text-[var(--color-text)]'}`}>
                    {t.type === 'credit' ? '+' : '−'}{usd(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 grid grid-cols-3 gap-3 border-t border-[var(--color-border)] pt-3 text-xs">
            <div><p className="text-[var(--color-text-muted)]">Deposited</p><p className="mt-0.5 font-semibold tabular-nums text-[var(--color-text)]">{usd(money.deposited)}</p></div>
            <div><p className="text-[var(--color-text-muted)]">Spent on bandwidth</p><p className="mt-0.5 font-semibold tabular-nums text-[var(--color-text)]">{usd(money.spent)}</p></div>
            <div><p className="text-[var(--color-text-muted)]">GB bought</p><p className="mt-0.5 font-semibold tabular-nums text-[var(--color-text)]">{gb(money.gbBought)} <span className="font-normal text-[var(--color-text-muted)]">· {int(money.orders)} orders</span></p></div>
          </div>
        </Card>

        <Card title="Network status" subtitle={stock ? `Mobile devices online now · ${int(stock.totals.mbl)} total` : 'Live status unavailable'}>
          {!stock ? <Empty>Could not load network status</Empty> : (
            <ul className="space-y-2">
              {countries.slice(0, 8).map((c) => (
                <li key={c.code} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-[var(--color-text)]"><span aria-hidden className="mr-1.5">{countryInfo(c.code).flag}</span>{countryInfo(c.code).name}</span>
                  {c.online > 0
                    ? <span className="shrink-0 text-xs tabular-nums text-[var(--color-text-muted)]">{int(c.online)} online</span>
                    : <Status level="warning">Low stock</Status>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
