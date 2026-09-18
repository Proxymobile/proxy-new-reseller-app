import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getAccountUser, getMoneyMonthly, getMoneySummary, getTransactions, type TxFilter } from '@/lib/customer-data';
import { FIRST_TOPUP_BONUS_USD } from '@/lib/pricing';
import { Alert, Card, Empty, PageHeader, StatTile, Td, Th } from '@/components/panel/ui';
import { TimeChart } from '@/components/panel/TimeChart';
import { gb, int, usd } from '@/components/panel/format';
import { AddFunds, RedeemPromo } from './BillingForms';

const FILTERS: [TxFilter, string][] = [['all', 'All'], ['deposits', 'Deposits'], ['purchases', 'Purchases'], ['credits', 'Bonuses & credits']];
const METHOD: Record<string, string> = { stripe: 'Card (Stripe)', crypto: 'Crypto', balance: 'Balance', admin: 'Support credit', system: 'Automatic' };
const PAGE = 25;

export default async function BillingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const filter = (FILTERS.find(([k]) => k === one(sp.filter))?.[0] ?? 'all') as TxFilter;
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const deposit = one(sp.deposit);
  const presetAmount = Number(one(sp.amount)) || null;

  const uid = session.user.id;
  const [user, money, series, txs] = await Promise.all([
    getAccountUser(uid), getMoneySummary(uid), getMoneyMonthly(uid, 12),
    getTransactions(uid, { filter, limit: PAGE, offset: (page - 1) * PAGE }),
  ]);
  if (!user) redirect('/login');
  const pages = Math.max(1, Math.ceil(txs.total / PAGE));
  const firstDeposit = money.deposited === 0;
  const hasActivity = series.some((s) => s.added || s.spent);
  const href = (f: TxFilter, p = 1) => `/dashboard/billing?${new URLSearchParams({ ...(f !== 'all' ? { filter: f } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`;

  return (
    <div>
      <PageHeader title="Billing" subtitle="Add funds, redeem codes and download your transaction history." />

      {deposit === 'success' && <div className="mb-4"><Alert level="good" title="Payment received">Your balance updates as soon as Stripe confirms the payment — usually within a few seconds. Refresh if you don&apos;t see it yet.</Alert></div>}
      {deposit === 'cancelled' && <div className="mb-4"><Alert level="neutral" title="Payment cancelled">Nothing was charged.</Alert></div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Balance" value={usd(user.balance)} hint="available for bandwidth" />
        <StatTile label="Deposited" value={usd(money.deposited)} hint="by card or crypto" />
        <StatTile label="Bonuses & credits" value={usd(money.credits)} hint={money.refunds ? `plus ${usd(money.refunds)} refunded` : 'welcome bonus, promo codes'} />
        <StatTile label="Spent on bandwidth" value={usd(money.spent)} hint={`${gb(money.gbBought)} across ${int(money.orders)} order${money.orders === 1 ? '' : 's'}`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card title="Add funds" subtitle="Secure card payment via Stripe" className="lg:col-span-3">
          <AddFunds firstDeposit={firstDeposit} bonus={FIRST_TOPUP_BONUS_USD} preset={presetAmount} />
        </Card>
        <div id="promo" className="scroll-mt-24 lg:col-span-2">
          <Card title="Redeem a promo code" subtitle="Free credit or trial bandwidth">
            <RedeemPromo />
          </Card>
        </div>
      </div>

      <Card title="Money in and out" subtitle="Last 12 months, per month" className="mt-4">
        {hasActivity ? (
          <TimeChart
            data={series.map((s) => ({ day: s.day, added: s.added, spent: s.spent }))}
            series={[{ key: 'added', label: 'Added', slot: 1 }, { key: 'spent', label: 'Spent', slot: 2 }]}
            period="month"
            format="usd"
            height={200}
          />
        ) : <Empty>No deposits or purchases in the last 12 months</Empty>}
      </Card>

      <Card
        title="Transactions"
        subtitle={`${int(txs.total)} ${filter === 'all' ? 'in total' : 'matching'}`}
        className="mt-4"
        action={<a href="/api/billing/export" className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]">Download CSV</a>}
      >
        <nav aria-label="Filter transactions" className="mb-3 flex flex-wrap gap-2">
          {FILTERS.map(([k, label]) => (
            <Link
              key={k}
              href={href(k)}
              aria-current={filter === k ? 'page' : undefined}
              className={`rounded-full border px-3 py-1 text-xs transition ${filter === k ? 'border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-bg)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        {txs.rows.length === 0 ? <Empty>No transactions here yet</Empty> : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-b border-[var(--color-border)]">
                <Th className="pl-5">Date</Th><Th>Description</Th><Th>Method</Th><Th>Invoice</Th><Th className="pr-5 text-right">Amount</Th>
              </tr></thead>
              <tbody>
                {txs.rows.map((t) => (
                  <tr key={t.id} className="border-b border-[var(--color-border)] last:border-0">
                    <Td className="pl-5 text-xs text-[var(--color-text-muted)]">{new Date(t.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Td>
                    <Td className="text-[var(--color-text)]">{t.reason}</Td>
                    <Td className="text-xs text-[var(--color-text-muted)]">{METHOD[t.method] ?? t.method}</Td>
                    <Td className="font-mono text-xs text-[var(--color-text-muted)]">{t.invoice ?? '—'}</Td>
                    <Td className={`pr-5 text-right font-semibold tabular-nums ${t.type === 'credit' ? 'text-[var(--viz-good-text)]' : 'text-[var(--color-text)]'}`}>
                      {t.type === 'credit' ? '+' : '−'}{usd(t.amount)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>Page {page} of {pages}</span>
            <span className="flex gap-2">
              {page > 1 && <Link href={href(filter, page - 1)} className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-[var(--color-text)]">← Newer</Link>}
              {page < pages && <Link href={href(filter, page + 1)} className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-[var(--color-text)]">Older →</Link>}
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}
