import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getAccountUser, getCustomerKey, getMoneySummary } from '@/lib/customer-data';
import { GB_TIERS, CUSTOM_DURATION_DAYS } from '@/lib/pricing';
import { Card, PageHeader, StatTile, Td, Th } from '@/components/panel/ui';
import { gb, usd } from '@/components/panel/format';
import { BuyPanel } from './BuyPanel';

export default async function PurchasePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const [user, { key }, money] = await Promise.all([
    getAccountUser(session.user.id), getCustomerKey(session.user.id), getMoneySummary(session.user.id),
  ]);
  if (!user) redirect('/login');

  return (
    <div>
      <PageHeader
        title="Buy bandwidth"
        subtitle="Pay once per GB from your balance. Every country, both pools and all rotation modes are included."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Balance" value={usd(user.balance)} href="/dashboard/billing" hint="add funds on the Billing page" />
        <StatTile label="Data left now" value={key ? (key.capGb === null ? 'Unlimited' : gb(key.leftGb ?? 0)) : '—'} hint={key ? `${gb(key.usedGb)} used so far` : 'no key yet — your first purchase creates it'} />
        <StatTile
          label="Expires"
          value={key?.expiresAt ? new Date(key.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
          hint={`each purchase adds ${CUSTOM_DURATION_DAYS} days`}
        />
        <StatTile label="Bought so far" value={gb(money.gbBought)} hint={`${money.orders} order${money.orders === 1 ? '' : 's'} · ${usd(money.spent)}`} />
      </div>

      <div className="mt-4">
        <BuyPanel
          balance={user.balance}
          hasKey={!!key}
          leftGb={key?.leftGb ?? null}
          expiresAt={key?.expiresAt ?? null}
          expired={key?.expired ?? false}
          tiers={GB_TIERS}
          durationDays={CUSTOM_DURATION_DAYS}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Volume pricing" subtitle="The more you buy at once, the lower the rate">
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[var(--color-border)]"><Th className="pl-5">Bandwidth</Th><Th className="text-right">Price</Th><Th className="text-right">Per GB</Th><Th className="pr-5 text-right">Saving</Th></tr></thead>
              <tbody>
                {GB_TIERS.map((t) => (
                  <tr key={t.gb} className="border-b border-[var(--color-border)] last:border-0">
                    <Td className="pl-5 font-medium text-[var(--color-text)]">{t.gb} GB</Td>
                    <Td className="text-right tabular-nums text-[var(--color-text)]">{usd(t.price)}</Td>
                    <Td className="text-right tabular-nums text-[var(--color-text)]">{usd(t.perGb)}</Td>
                    <Td className="pr-5 text-right tabular-nums text-[var(--color-text-muted)]">{t.discount ? `${t.discount}%` : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="How it works">
          <ul className="space-y-3 text-sm">
            {[
              ['One key, everywhere', 'Your GB work in every country and in both the mobile and residential pools. Choose per request on the Proxy setup page.'],
              ['Top-ups stack', `Buying again adds the GB to your key and pushes the expiry ${CUSTOM_DURATION_DAYS} days out from today or your current expiry, whichever is later.`],
              ['No surprise charges', 'When your data runs out, connections stop. Nothing is billed automatically.'],
              ['Instant', 'Bandwidth is active the second your purchase completes — your proxy URLs don\'t change.'],
            ].map(([t, b]) => (
              <li key={t}>
                <p className="font-medium text-[var(--color-text)]">{t}</p>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{b}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
