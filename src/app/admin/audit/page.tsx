import { query } from '@/lib/db';

interface AuditRow {
  id: string;
  email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export default async function AuditPage() {
  const logs = await query<AuditRow>(`
    SELECT a.id, u.email, a.action, a.target_type, a.target_id,
           a.metadata, a.ip_address, a.created_at
    FROM audit_log a
    LEFT JOIN users u ON u.id = a.actor_id
    ORDER BY a.created_at DESC
    LIMIT 100
  `, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">Audit Log</h1>

      <div className="rounded-xl border border-[var(--color-border)] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                <th className="text-left p-3 font-medium">Time</th>
                <th className="text-left p-3 font-medium">Actor</th>
                <th className="text-left p-3 font-medium">Action</th>
                <th className="text-left p-3 font-medium">Target</th>
                <th className="text-left p-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="p-3 text-[var(--color-text-muted)] whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="p-3 text-[var(--color-text)]">{log.email ?? 'System'}</td>
                  <td className="p-3">
                    <span className="inline-block rounded bg-[var(--color-bg)] px-2 py-0.5 text-xs font-mono text-[var(--color-primary)]">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-[var(--color-text-muted)]">
                    {log.target_type ? `${log.target_type}:${log.target_id}` : '—'}
                  </td>
                  <td className="p-3 text-xs text-[var(--color-text-muted)] font-mono max-w-xs truncate">
                    {Object.keys(log.metadata).length > 0 ? JSON.stringify(log.metadata) : '—'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[var(--color-text-muted)]">
                    No audit events yet
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
