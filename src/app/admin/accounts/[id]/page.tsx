'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface UserDetail {
  id: string;
  label: string;
  email: string | null;
  role: string;
  enabled: boolean;
  balance_usd: string;
  created_at: string;
  updated_at: string;
  customer_id: string | null;
  pak_key_id: string | null;
  traffic_cap_gb: string | null;
  traffic_used_gb: string | null;
  plan_id: string | null;
  expires_at: string | null;
}

interface Wallet {
  chain: string;
  address: string;
  verified: boolean;
  linked_at: string;
}

interface Transaction {
  id: string;
  amount_usd: string;
  type: 'credit' | 'debit';
  reason: string;
  reference: string | null;
  created_at: string;
  created_by_label: string | null;
}

interface Purchase {
  id: string;
  plan_id: string;
  gb_amount: string;
  price_usd: string;
  status: string;
  created_at: string;
}

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [saving, setSaving] = useState(false);

  // Balance modal
  const [balanceModal, setBalanceModal] = useState<'credit' | 'debit' | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Action feedback
  const [actionResult, setActionResult] = useState<{ code?: string } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUser = useCallback(async () => {
    const res = await fetch(`/api/admin/accounts/${userId}`);
    if (!res.ok) {
      setError('User not found');
      setLoading(false);
      return;
    }
    const data = await res.json();
    setUser(data.user);
    setWallets(data.wallets);
    setTransactions(data.transactions);
    setPurchases(data.purchases);
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadUser(); }, [loadUser]);

  async function handleAction(action: string) {
    const res = await fetch('/api/admin/accounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.accessCode) {
        setActionResult({ code: data.accessCode });
      }
      setMessage({ type: 'success', text: action === 'toggle_enabled' ? 'Status toggled' : 'Action completed' });
      loadUser();
    }
  }

  async function handleSaveEdit() {
    setSaving(true);
    const res = await fetch(`/api/admin/accounts/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: editLabel,
        email: editEmail || null,
        role: editRole,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(false);
      setMessage({ type: 'success', text: 'User updated' });
      loadUser();
    } else {
      const data = await res.json();
      setMessage({ type: 'error', text: data.error ?? 'Failed to update' });
    }
  }

  async function handleBalance() {
    if (!balanceModal || !balanceAmount) return;
    setBalanceLoading(true);
    const res = await fetch('/api/admin/balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        amount: Number(balanceAmount),
        type: balanceModal,
        reason: balanceReason || undefined,
      }),
    });
    setBalanceLoading(false);
    if (res.ok) {
      const data = await res.json();
      setBalanceModal(null);
      setBalanceAmount('');
      setBalanceReason('');
      setMessage({ type: 'success', text: `Balance updated. New balance: $${data.balance.toFixed(2)}` });
      loadUser();
    } else {
      const data = await res.json();
      setMessage({ type: 'error', text: data.error ?? 'Failed to update balance' });
    }
  }

  function startEdit() {
    if (!user) return;
    setEditLabel(user.label);
    setEditEmail(user.email ?? '');
    setEditRole(user.role);
    setEditing(true);
  }

  if (loading) return <p className="text-[var(--color-text-muted)]">Loading...</p>;
  if (error || !user) return <p className="text-red-500">{error || 'User not found'}</p>;

  const balance = Number(user.balance_usd ?? 0);

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/accounts" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition">
          &larr; Accounts
        </Link>
        <span className="text-[var(--color-border)]">/</span>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">{user.label}</h1>
        <span
          className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: user.enabled ? '#dcfce7' : '#fee2e2',
            color: user.enabled ? '#059669' : '#dc2626',
          }}
        >
          {user.enabled ? 'Active' : 'Disabled'}
        </span>
        <span className={`text-xs ${user.role === 'admin' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}>
          {user.role}
        </span>
      </div>

      {/* Messages */}
      {message && (
        <div className={`rounded-lg border p-3 mb-4 text-sm ${
          message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-600'
        }`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right text-xs opacity-60 hover:opacity-100">&times;</button>
        </div>
      )}

      {actionResult?.code && (
        <div className="rounded-xl border border-[var(--color-accent)] bg-white p-4 mb-4">
          <p className="text-sm text-[var(--color-text-muted)] mb-1">New access code:</p>
          <p className="text-lg font-mono font-bold text-[var(--color-accent)] tracking-wider select-all">{actionResult.code}</p>
          <p className="text-xs text-red-400 mt-1">Copy now — won&apos;t be shown again.</p>
          <button onClick={() => setActionResult(null)} className="mt-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Dismiss</button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* === Left Column: User Info + Actions === */}
        <div className="lg:col-span-1 space-y-4">
          {/* User Info Card */}
          <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">Label</label>
                  <input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">Email</label>
                  <input
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} disabled={saving} className="flex-1 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-40">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setEditing(false)} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2.5">
                  <InfoRow label="Label" value={user.label} />
                  <InfoRow label="Email" value={user.email || '—'} />
                  <InfoRow label="Role" value={user.role} />
                  <InfoRow label="Created" value={new Date(user.created_at).toLocaleString()} />
                  <InfoRow label="Updated" value={new Date(user.updated_at).toLocaleString()} />
                </div>
                <button onClick={startEdit} className="mt-4 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition">
                  Edit Details
                </button>
              </>
            )}
          </div>

          {/* Balance Card */}
          <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Balance</p>
            <p className="text-3xl font-bold text-[var(--color-text)] mb-4">${balance.toFixed(2)}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setBalanceModal('credit')}
                className="flex-1 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-xs font-medium text-white hover:opacity-90 transition"
              >
                + Credit
              </button>
              <button
                onClick={() => setBalanceModal('debit')}
                className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition"
              >
                - Debit
              </button>
            </div>
          </div>

          {/* Actions Card */}
          <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 space-y-2">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Actions</p>
            <button
              onClick={() => handleAction('toggle_enabled')}
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition text-left"
            >
              {user.enabled ? 'Disable Account' : 'Enable Account'}
            </button>
            <button
              onClick={() => handleAction('regenerate_code')}
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-primary)] hover:bg-[var(--color-surface-hover)] transition text-left"
            >
              Regenerate Access Code
            </button>
            {wallets.length > 0 && (
              <button
                onClick={() => handleAction('unlink_wallet')}
                className="w-full rounded-lg border border-red-200 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition text-left"
              >
                Unlink All Wallets
              </button>
            )}
          </div>

          {/* Wallets */}
          {wallets.length > 0 && (
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
              <p className="text-xs text-[var(--color-text-muted)] mb-3">Linked Wallets</p>
              <div className="space-y-2">
                {wallets.map((w) => (
                  <div key={`${w.chain}-${w.address}`} className="rounded-lg bg-[var(--color-bg)] px-3 py-2">
                    <span className="text-[10px] font-medium text-[var(--color-text)] uppercase">{w.chain}</span>
                    <p className="text-xs font-mono text-[var(--color-text-muted)] mt-0.5 break-all">{w.address}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                      {w.verified ? 'Verified' : 'Unverified'} &middot; {new Date(w.linked_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proxy Key */}
          {user.pak_key_id && (
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
              <p className="text-xs text-[var(--color-text-muted)] mb-3">Proxy Key</p>
              <InfoRow label="Key ID" value={user.pak_key_id} mono />
              <InfoRow label="Plan" value={user.plan_id || '—'} />
              <InfoRow label="Traffic" value={
                user.traffic_cap_gb
                  ? `${Number(user.traffic_used_gb ?? 0).toFixed(1)} / ${Number(user.traffic_cap_gb)} GB`
                  : '—'
              } />
              <InfoRow label="Expires" value={
                user.expires_at ? new Date(user.expires_at).toLocaleDateString() : 'Never'
              } />
            </div>
          )}
        </div>

        {/* === Right Column: History === */}
        <div className="lg:col-span-2 space-y-4">
          {/* Balance Transactions */}
          <div className="rounded-xl border border-[var(--color-border)] bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--color-border)]">
              <h2 className="text-sm font-semibold text-[var(--color-text)]">Balance History</h2>
            </div>
            {transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                      <th className="text-left p-3 font-medium text-xs">Date</th>
                      <th className="text-left p-3 font-medium text-xs">Type</th>
                      <th className="text-right p-3 font-medium text-xs">Amount</th>
                      <th className="text-left p-3 font-medium text-xs">Reason</th>
                      <th className="text-left p-3 font-medium text-xs">By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-[var(--color-border)] last:border-0">
                        <td className="p-3 text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                          {new Date(tx.created_at).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span
                            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: tx.type === 'credit' ? '#dcfce7' : '#fee2e2',
                              color: tx.type === 'credit' ? '#059669' : '#dc2626',
                            }}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className={`text-xs font-medium ${tx.type === 'credit' ? 'text-[#059669]' : 'text-[#dc2626]'}`}>
                            {tx.type === 'credit' ? '+' : '-'}${Number(tx.amount_usd).toFixed(2)}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-[var(--color-text-muted)] max-w-[200px] truncate">
                          {tx.reason}
                        </td>
                        <td className="p-3 text-xs text-[var(--color-text-muted)]">
                          {tx.created_by_label ?? 'System'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="p-6 text-center text-sm text-[var(--color-text-muted)]">No transactions yet</p>
            )}
          </div>

          {/* Purchases */}
          <div className="rounded-xl border border-[var(--color-border)] bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--color-border)]">
              <h2 className="text-sm font-semibold text-[var(--color-text)]">Purchase History</h2>
            </div>
            {purchases.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                      <th className="text-left p-3 font-medium text-xs">Date</th>
                      <th className="text-left p-3 font-medium text-xs">Plan</th>
                      <th className="text-right p-3 font-medium text-xs">GB</th>
                      <th className="text-right p-3 font-medium text-xs">Price</th>
                      <th className="text-left p-3 font-medium text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((p) => (
                      <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0">
                        <td className="p-3 text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                          {new Date(p.created_at).toLocaleString()}
                        </td>
                        <td className="p-3 text-xs text-[var(--color-text)] font-medium">{p.plan_id}</td>
                        <td className="p-3 text-xs text-[var(--color-text-muted)] text-right">{Number(p.gb_amount)} GB</td>
                        <td className="p-3 text-xs text-[var(--color-text)] text-right font-medium">${Number(p.price_usd).toFixed(2)}</td>
                        <td className="p-3">
                          <span
                            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: p.status === 'completed' ? '#dcfce7' : p.status === 'failed' ? '#fee2e2' : '#fef3c7',
                              color: p.status === 'completed' ? '#059669' : p.status === 'failed' ? '#dc2626' : '#d97706',
                            }}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="p-6 text-center text-sm text-[var(--color-text-muted)]">No purchases yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Balance Modal */}
      {balanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 w-full max-w-sm">
            <h3 className="text-sm font-medium text-[var(--color-text)] mb-4">
              {balanceModal === 'credit' ? 'Add Credit' : 'Debit Balance'} — {user.label}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={balanceModal === 'debit' ? balance : 10000}
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                  placeholder="0.00"
                  autoFocus
                />
                {balanceModal === 'debit' && (
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Available: ${balance.toFixed(2)}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                  placeholder={balanceModal === 'credit' ? 'e.g. Payment received' : 'e.g. Refund, Correction'}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleBalance}
                disabled={balanceLoading || !balanceAmount || Number(balanceAmount) <= 0}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-40 ${
                  balanceModal === 'credit' ? 'bg-[var(--color-accent)]' : 'bg-red-500'
                }`}
              >
                {balanceLoading
                  ? 'Processing...'
                  : balanceModal === 'credit'
                    ? `+ $${Number(balanceAmount || 0).toFixed(2)}`
                    : `- $${Number(balanceAmount || 0).toFixed(2)}`}
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
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2 py-0.5">
      <span className="text-xs text-[var(--color-text-muted)] shrink-0">{label}</span>
      <span className={`text-xs text-[var(--color-text)] text-right ${mono ? 'font-mono' : ''} break-all`}>{value}</span>
    </div>
  );
}
