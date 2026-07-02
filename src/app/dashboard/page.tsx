import { auth } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { redirect } from 'next/navigation';
import { config, getPlan } from '@/config';
import Link from 'next/link';
import { BuyConfigurator } from './_components/BuyConfigurator';
import {
  IconWallet, IconKey, IconActivity, IconGlobe, IconClock, IconCheck,
} from './_components/icons';

interface Customer {
  id: string;
  pak_key_id: string | null;
  traffic_cap_gb: string;
  traffic_used_gb: string;
  plan_id: string | null;
  expires_at: string | null;
  enabled?: boolean;
  created_at?: string;
}

interface UserInfo {
  label: string;
  enabled: boolean;
  balance_usd: string;
  created_at: string;
}

interface PurchaseStats {
  total_gb: string;
  count: string;
  last_at: string | null;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await queryOne<UserInfo>(
    'SELECT label, enabled, balance_usd, created_at FROM users WHERE id = $1',
    [session.user.id],
  );

  const customer = await queryOne<Customer>(
    'SELECT id, pak_key_id, traffic_cap_gb, traffic_used_gb, plan_id, expires_at FROM customers WHERE user_id = $1',
    [session.user.id],
  );

  const purchaseStats = await queryOne<PurchaseStats>(
    `SELECT
       COALESCE(SUM(gb_amount), 0) AS total_gb,
       COUNT(*) AS count,
       MAX(created_at) AS last_at
     FROM purchases p
     WHERE p.customer_id = $1 AND p.status = 'completed'`,
    [customer?.id ?? '00000000-0000-0000-0000-000000000000'],
  );

  const plan = customer?.plan_id ? getPlan(customer.plan_id) : null;
  const usedGB = Number(customer?.traffic_used_gb ?? 0);
  const capGB = Number(customer?.traffic_cap_gb ?? 0);
  const remainingGB = Math.max(0, capGB - usedGB);
  const usagePercent = capGB > 0 ? Math.min(100, (usedGB / capGB) * 100) : 0;
  const daysLeft = customer?.expires_at
    ? Math.max(0, Math.ceil((new Date(customer.expires_at).getTime() - Date.now()) / 86400000))
    : null;
  const balance = Number(user?.balance_usd ?? 0);
  const totalPurchasedGB = Number(purchaseStats?.total_gb ?? 0);
  const purchaseCount = Number(purchaseStats?.count ?? 0);
  const lastPurchase = purchaseStats?.last_at ? new Date(purchaseStats.last_at) : null;

  const hasActiveKey = !!customer?.pak_key_id && !!plan;

  return (
    <div className="space-y-6">
      {/* Welcome row */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Welcome{user?.label ? `, ${user.label}` : ''}
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {hasActiveKey
            ? 'Your proxy plan is active. Generate URLs from the Keys page or top up below.'
            : 'Get started by purchasing your first plan below — first request in under a minute.'}
        </p>
      </div>

      {/* Stat cards row 1 — primary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<IconWallet className="h-4 w-4" />}
          label="Balance"
          value={`$${balance.toFixed(2)}`}
          accent="primary"
          action={<Link href="/dashboard/billing" className="text-[10px] text-[var(--color-primary)] hover:underline">Top up →</Link>}
        />
        <StatCard
          icon={<IconKey className="h-4 w-4" />}
          label="Active Keys"
          value={hasActiveKey ? '1' : '0'}
          subtext={hasActiveKey ? 'Plan active' : 'No active plan'}
          accent={hasActiveKey ? 'success' : 'muted'}
        />
        <StatCard
          icon={<IconActivity className="h-4 w-4" />}
          label="Current Plan"
          value={plan?.displayName ?? '—'}
          subtext={plan ? `${plan.gb} GB · ${plan.durationDays} days` : 'No plan'}
        />
        <StatCard
          icon={<IconCheck className="h-4 w-4" />}
          label="Account Status"
          value={user?.enabled ? 'Active' : 'Inactive'}
          accent={user?.enabled ? 'success' : 'danger'}
          subtext={user?.created_at ? `Member since ${new Date(user.created_at).toLocaleDateString()}` : ''}
        />
      </div>

      {/* Stat cards row 2 — usage metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<IconGlobe className="h-4 w-4" />}
          label="Total Purchased"
          value={`${totalPurchasedGB.toFixed(0)} GB`}
          subtext={`${purchaseCount} purchase${purchaseCount === 1 ? '' : 's'}`}
        />
        <StatCard
          icon={<IconActivity className="h-4 w-4" />}
          label="Used GB"
          value={`${usedGB.toFixed(2)} GB`}
          subtext={capGB > 0 ? `of ${capGB} GB cap` : 'No active plan'}
          accent="warning"
        />
        <StatCard
          icon={<IconCheck className="h-4 w-4" />}
          label="Remaining GB"
          value={`${remainingGB.toFixed(2)} GB`}
          subtext={capGB > 0 ? `${usagePercent.toFixed(1)}% used` : 'No active plan'}
          accent={remainingGB > 1 ? 'success' : 'danger'}
        />
        <StatCard
          icon={<IconClock className="h-4 w-4" />}
          label="Last Purchase"
          value={lastPurchase ? lastPurchase.toLocaleDateString() : '—'}
          subtext={daysLeft !== null ? `${daysLeft} days remaining` : 'No active plan'}
        />
      </div>

      {/* Active plan detail card with usage bar */}
      {hasActiveKey && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[var(--color-text)]">{plan!.displayName} Plan</h2>
                <span
                  className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    backgroundColor: user?.enabled ? '#dcfce7' : '#fee2e2',
                    color: user?.enabled ? '#059669' : '#dc2626',
                  }}
                >
                  {user?.enabled ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {plan!.gb} GB · {plan!.durationDays} days · ${(plan!.priceUsd / plan!.gb).toFixed(2)} per GB
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/dashboard/keys"
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition shadow-sm shadow-[var(--color-primary)]/20"
              >
                Generate Proxies
              </Link>
              <Link
                href="/dashboard/purchase"
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition"
              >
                Top Up
              </Link>
            </div>
          </div>

          {capGB > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--color-text-muted)]">Bandwidth usage</span>
                <span className="text-xs font-semibold text-[var(--color-text)]">
                  {usedGB.toFixed(2)} / {capGB} GB · {usagePercent.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--color-bg)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${usagePercent}%`,
                    backgroundColor: usagePercent > 90 ? '#ef4444' : usagePercent > 70 ? '#f59e0b' : 'var(--color-primary)',
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] text-[var(--color-text-muted)]">
                <span>{remainingGB.toFixed(2)} GB remaining</span>
                {customer?.expires_at && (
                  <span>Expires {new Date(customer.expires_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Configure & Buy section */}
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text)]">
              {hasActiveKey ? 'Buy More Proxies' : 'Configure & Buy Mobile Proxies'}
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {hasActiveKey
                ? 'Top up your account with another plan — keys stack and extend automatically.'
                : 'Choose your bandwidth and pool — all countries included. Get your access key in seconds.'}
            </p>
          </div>
        </div>
        <BuyConfigurator />
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, subtext, action, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  action?: React.ReactNode;
  accent?: 'primary' | 'success' | 'warning' | 'danger' | 'muted';
}) {
  const accentColor =
    accent === 'primary' ? 'text-[var(--color-primary)]' :
    accent === 'success' ? 'text-emerald-600' :
    accent === 'warning' ? 'text-amber-600' :
    accent === 'danger' ? 'text-red-500' :
    accent === 'muted' ? 'text-[var(--color-text-muted)]' :
    'text-[var(--color-text)]';

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:shadow-sm hover:border-[var(--color-primary)]/20 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-bg)] text-[var(--color-text-muted)]">
          {icon}
        </div>
        {action}
      </div>
      <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold mb-1">
        {label}
      </p>
      <p className={`text-xl font-bold ${accentColor}`}>{value}</p>
      {subtext && <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 truncate">{subtext}</p>}
    </div>
  );
}

