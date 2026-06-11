import { query, queryOne } from '@/lib/db';

interface KeyRow {
  customer_id: string;
  email: string;
  label: string;
  pak_key_id: string;
  traffic_cap_gb: string;
  traffic_used_gb: string;
  enabled: boolean;
  expires_at: string | null;
  plan_id: string | null;
}

interface KeyStats {
  total: number;
  active: number;
  suspended: number;
  expired: number;
  totalTrafficGB: number;
  totalCapGB: number;
}

export default async function AdminKeysPage() {
  const keys = await query<KeyRow>(`
    SELECT
      c.id AS customer_id, u.email, u.label, c.pak_key_id,
      c.traffic_cap_gb, c.traffic_used_gb, u.enabled, c.expires_at, c.plan_id
    FROM customers c
    JOIN users u ON u.id = c.user_id
    WHERE c.pak_key_id IS NOT NULL
    ORDER BY c.created_at DESC
  `, []);

  const statsRow = await queryOne<{
    total: string;
    active: string;
    suspended: string;
    expired: string;
    total_traffic: string;
    total_cap: string;
  }>(`
    SELECT
      COUNT(*)::text AS total,
      COUNT(*) FILTER (WHERE u.enabled AND (c.expires_at IS NULL OR c.expires_at > NOW()))::text AS active,
      COUNT(*) FILTER (WHERE NOT u.enabled)::text AS suspended,
      COUNT(*) FILTER (WHERE c.expires_at IS NOT NULL AND c.expires_at <= NOW())::text AS expired,
      COALESCE(SUM(c.traffic_used_gb), 0)::text AS total_traffic,
      COALESCE(SUM(c.traffic_cap_gb), 0)::text AS total_cap
    FROM customers c
    JOIN users u ON u.id = c.user_id
    WHERE c.pak_key_id IS NOT NULL
  `, []);

  const stats: KeyStats = {
    total: Number(statsRow?.total ?? 0),
    active: Number(statsRow?.active ?? 0),
    suspended: Number(statsRow?.suspended ?? 0),
    expired: Number(statsRow?.expired ?? 0),
    totalTrafficGB: Number(statsRow?.total_traffic ?? 0),
    totalCapGB: Number(statsRow?.total_cap ?? 0),
  };

  const usagePercent = stats.totalCapGB > 0
    ? ((stats.totalTrafficGB / stats.totalCapGB) * 100).toFixed(1)
    : '0';

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">All Proxy Keys</h1>

      {/* Key Stats */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 mb-6">
        <StatCard label="Total Keys" value={String(stats.total)} />
        <StatCard label="Active" value={String(stats.active)} accent="green" />
        <StatCard label="Suspended" value={String(stats.suspended)} accent={stats.suspended > 0 ? 'red' : undefined} />
        <StatCard label="Expired" value={String(stats.expired)} accent={stats.expired > 0 ? 'red' : undefined} />
        <StatCard label="Traffic Used" value={`${stats.totalTrafficGB.toFixed(1)} GB`} />
        <StatCard label="Utilization" value={`${usagePercent}%`} />
      </div>

      {/* Keys Table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                <th className="text-left p-3 font-medium">Customer</th>
                <th className="text-left p-3 font-medium">Key ID</th>
                <th className="text-left p-3 font-medium">Plan</th>
                <th className="text-left p-3 font-medium">Traffic</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Expires</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => {
                const usedGB = Number(k.traffic_used_gb);
                const capGB = Number(k.traffic_cap_gb);
                const pct = capGB > 0 ? Math.min(100, (usedGB / capGB) * 100) : 0;
                const isExpired = k.expires_at && new Date(k.expires_at) <= new Date();
                const isActive = k.enabled && !isExpired;

                return (
                  <tr key={k.customer_id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)]">
                    <td className="p-3">
                      <span className="text-xs font-medium text-[var(--color-text)]">{k.label}</span>
                      <span className="block text-[10px] text-[var(--color-text-muted)]">{k.email}</span>
                    </td>
                    <td className="p-3 font-mono text-xs text-[var(--color-text-muted)]">
                      {k.pak_key_id}
                    </td>
                    <td className="p-3 text-xs text-[var(--color-text-muted)]">
                      {k.plan_id ?? '-'}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-[60px]">
                          <div className="h-1.5 rounded-full bg-[var(--color-bg)] overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: pct > 90 ? '#dc2626' : pct > 70 ? '#f59e0b' : '#059669',
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                          {usedGB.toFixed(1)}/{capGB} GB
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: isActive ? '#10b98120' : '#ef444420',
                          color: isActive ? '#10b981' : '#ef4444',
                        }}
                      >
                        {isExpired ? 'Expired' : k.enabled ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-[var(--color-text-muted)]">
                      {k.expires_at ? new Date(k.expires_at).toLocaleDateString() : 'Never'}
                    </td>
                  </tr>
                );
              })}
              {keys.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[var(--color-text-muted)]">
                    No keys issued yet
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

function StatCard({ label, value, accent }: { label: string; value: string; accent?: 'green' | 'red' }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">{label}</p>
      <p className="text-lg font-semibold" style={{
        color: accent === 'green' ? '#059669' : accent === 'red' ? '#dc2626' : 'var(--color-text)',
      }}>{value}</p>
    </div>
  );
}
