import { query, queryOne } from '@/lib/db';

interface Stats {
  total_accounts: string;
  active_accounts: string;
  wallet_linked: string;
  total_purchases: string;
  total_revenue: string;
  total_balance: string;
}

export default async function AdminDashboard() {
  const stats = await queryOne<Stats>(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE role = 'customer')::text AS total_accounts,
      (SELECT COUNT(*) FROM users u JOIN customers c ON c.user_id = u.id WHERE u.enabled = true AND c.pak_key_id IS NOT NULL)::text AS active_accounts,
      (SELECT COUNT(DISTINCT user_id) FROM wallet_links WHERE verified = true)::text AS wallet_linked,
      (SELECT COUNT(*) FROM purchases WHERE status = 'completed')::text AS total_purchases,
      (SELECT COALESCE(SUM(price_usd), 0) FROM purchases WHERE status = 'completed')::text AS total_revenue,
      (SELECT COALESCE(SUM(balance_usd), 0) FROM users)::text AS total_balance
  `, []);

  const recentAccounts = await query<{
    id: string;
    label: string;
    role: string;
    enabled: boolean;
    created_at: string;
    has_wallet: boolean;
  }>(`
    SELECT u.id, u.label, u.role, u.enabled, u.created_at,
           EXISTS(SELECT 1 FROM wallet_links w WHERE w.user_id = u.id AND w.verified = true) AS has_wallet
    FROM users u
    ORDER BY u.created_at DESC
    LIMIT 10
  `, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">Admin Overview</h1>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 mb-8">
        <StatCard label="Accounts" value={stats?.total_accounts ?? '0'} />
        <StatCard label="Active" value={stats?.active_accounts ?? '0'} />
        <StatCard label="Wallets" value={stats?.wallet_linked ?? '0'} />
        <StatCard label="Sales" value={stats?.total_purchases ?? '0'} />
        <StatCard label="Revenue" value={`$${Number(stats?.total_revenue ?? 0).toFixed(2)}`} />
        <StatCard label="Balances" value={`$${Number(stats?.total_balance ?? 0).toFixed(2)}`} />
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Recent Accounts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                <th className="text-left p-3 font-medium">Label</th>
                <th className="text-left p-3 font-medium">Role</th>
                <th className="text-left p-3 font-medium">Wallet</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentAccounts.map((a) => (
                <tr key={a.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="p-3 text-[var(--color-text)] font-medium">{a.label}</td>
                  <td className="p-3">
                    <span className={`text-xs ${a.role === 'admin' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}>
                      {a.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: a.has_wallet ? '#6366f120' : 'transparent',
                        color: a.has_wallet ? '#6366f1' : 'var(--color-text-muted)',
                      }}
                    >
                      {a.has_wallet ? 'Linked' : '—'}
                    </span>
                  </td>
                  <td className="p-3">
                    <StatusBadge enabled={a.enabled} />
                  </td>
                  <td className="p-3 text-[var(--color-text-muted)]">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {recentAccounts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[var(--color-text-muted)]">
                    No accounts yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-xs text-[var(--color-text-muted)] mb-1">{label}</p>
      <p className="text-2xl font-bold text-[var(--color-text)]">{value}</p>
    </div>
  );
}

function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: enabled ? '#10b98120' : '#ef444420',
        color: enabled ? '#10b981' : '#ef4444',
      }}
    >
      {enabled ? 'Active' : 'Disabled'}
    </span>
  );
}
