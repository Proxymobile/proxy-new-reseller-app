'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Account {
  id: string;
  label: string;
  email: string | null;
  role: string;
  enabled: boolean;
  balance_usd: string;
  created_at: string;
  customer_id: string | null;
  pak_key_id: string | null;
  traffic_cap_gb: string | null;
  traffic_used_gb: string | null;
  plan_id: string | null;
  expires_at: string | null;
  wallets: Array<{ chain: string; address: string; verified: boolean }> | null;
}

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionResult, setActionResult] = useState<{ id: string; code?: string } | null>(null);
  const [balanceModal, setBalanceModal] = useState<{ userId: string; label: string } | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => { loadAccounts(); }, []);

  async function loadAccounts() {
    const res = await fetch('/api/admin/accounts');
    if (res.ok) {
      const data = await res.json();
      setAccounts(data.accounts);
    }
    setLoading(false);
  }

  async function handleAction(userId: string, action: string) {
    const res = await fetch('/api/admin/accounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.accessCode) {
        setActionResult({ id: userId, code: data.accessCode });
      }
      loadAccounts();
    }
  }

  async function handleAddBalance() {
    if (!balanceModal || !balanceAmount) return;
    setBalanceLoading(true);
    const res = await fetch('/api/admin/balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: balanceModal.userId,
        amount: Number(balanceAmount),
        reason: balanceReason || undefined,
      }),
    });
    setBalanceLoading(false);
    if (res.ok) {
      setBalanceModal(null);
      setBalanceAmount('');
      setBalanceReason('');
      loadAccounts();
    }
  }

  if (loading) return <p className="text-[var(--color-text-muted)]">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Accounts</h1>
        <a
          href="/admin/accounts/create"
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
        >
          Create Account
        </a>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by label or email..."
          className="w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/40 focus:outline-none focus:border-[var(--color-primary)]"
        />
      </div>

      {actionResult?.code && (
        <div className="rounded-xl border border-[var(--color-accent)] bg-white p-4 mb-6">
          <p className="text-sm text-[var(--color-text-muted)] mb-1">New access code generated:</p>
          <p className="text-lg font-mono font-bold text-[var(--color-accent)] tracking-wider select-all">
            {actionResult.code}
          </p>
          <p className="text-xs text-red-400 mt-2">Copy this now — it won&apos;t be shown again.</p>
          <button
            onClick={() => setActionResult(null)}
            className="mt-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Balance Modal */}
      {balanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 w-full max-w-sm">
            <h3 className="text-sm font-medium text-[var(--color-text)] mb-4">
              Add Balance — {balanceModal.label}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="10000"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                  placeholder="e.g. Payment received"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddBalance}
                disabled={balanceLoading || !balanceAmount || Number(balanceAmount) <= 0}
                className="flex-1 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-40"
              >
                {balanceLoading ? 'Adding...' : `Add $${Number(balanceAmount || 0).toFixed(2)}`}
              </button>
              <button
                onClick={() => { setBalanceModal(null); setBalanceAmount(''); setBalanceReason(''); }}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[var(--color-border)] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                <th className="text-left p-3 font-medium">Label</th>
                <th className="text-left p-3 font-medium">Role</th>
                <th className="text-left p-3 font-medium">Balance</th>
                <th className="text-left p-3 font-medium">Traffic</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Created</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.filter((a) => {
                if (!search.trim()) return true;
                const q = search.toLowerCase();
                return a.label.toLowerCase().includes(q) || (a.email?.toLowerCase().includes(q) ?? false);
              }).map((a) => (
                <tr
                  key={a.id}
                  onClick={() => router.push(`/admin/accounts/${a.id}`)}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)] cursor-pointer">
                  <td className="p-3">
                    <span className="text-[var(--color-text)] font-medium">{a.label}</span>
                    {a.email && (
                      <span className="block text-xs text-[var(--color-text-muted)]">{a.email}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={a.role === 'admin' ? 'text-[var(--color-accent)] text-xs' : 'text-[var(--color-text-muted)] text-xs'}>
                      {a.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-[var(--color-text)] text-xs font-medium">
                      ${Number(a.balance_usd ?? 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="p-3 text-[var(--color-text-muted)] text-xs">
                    {a.traffic_cap_gb
                      ? `${Number(a.traffic_used_gb ?? 0).toFixed(1)} / ${Number(a.traffic_cap_gb)} GB`
                      : '—'}
                  </td>
                  <td className="p-3">
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: a.enabled ? '#10b98120' : '#ef444420',
                        color: a.enabled ? '#10b981' : '#ef4444',
                      }}
                    >
                      {a.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-3 text-[var(--color-text-muted)] text-xs">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setBalanceModal({ userId: a.id, label: a.label })}
                        className="text-xs text-[var(--color-accent)] hover:text-[var(--color-text)] transition"
                      >
                        + Balance
                      </button>
                      <button
                        onClick={() => handleAction(a.id, 'toggle_enabled')}
                        className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition"
                      >
                        {a.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleAction(a.id, 'regenerate_code')}
                        className="text-xs text-[var(--color-primary)] hover:text-[var(--color-text)] transition"
                      >
                        New Code
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-[var(--color-text-muted)]">
                    No accounts yet. Create one to get started.
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
