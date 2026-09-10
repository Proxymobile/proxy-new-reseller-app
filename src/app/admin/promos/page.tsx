'use client';

import { useState, useEffect, useCallback } from 'react';

interface Promo {
  id: string;
  code: string;
  description: string | null;
  credit_usd: string;
  max_redemptions: number | null;
  redemption_count: number;
  per_ip_limit: number;
  new_users_only: boolean;
  active: boolean;
  expires_at: string | null;
  created_at: string;
  total_credited: string;
}

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create form
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [creditUsd, setCreditUsd] = useState('1.40');
  const [maxRedemptions, setMaxRedemptions] = useState('500');
  const [newUsersOnly, setNewUsersOnly] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/promos');
    if (res.ok) {
      const data = await res.json();
      setPromos(data.promos);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          description: description || undefined,
          creditUsd: Number(creditUsd),
          maxRedemptions: maxRedemptions ? Number(maxRedemptions) : undefined,
          newUsersOnly,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create code');
      setMessage({ type: 'success', text: `Code ${data.promo.code} created.` });
      setCode('');
      setDescription('');
      await load();
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to create code' });
    }
    setCreating(false);
  }

  async function toggle(promo: Promo) {
    const res = await fetch(`/api/admin/promos/${promo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !promo.active }),
    });
    if (res.ok) await load();
  }

  const mbEquivalent = (usd: string) => `${Math.round((Number(usd) / 7) * 1024)} MB`;

  if (loading) return <p className="text-[var(--color-text-muted)]">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">Promo Codes</h1>

      {message && (
        <div className={`rounded-lg border p-3 mb-4 text-sm ${
          message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-600'
        }`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right text-xs opacity-60 hover:opacity-100">&times;</button>
        </div>
      )}

      {/* Create */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 mb-6">
        <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3">Create Code</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32))}
              placeholder="TELEGRAM200"
              required
              spellCheck={false}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] font-mono focus:outline-none focus:border-[var(--color-primary)] w-40"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Credit (USD)</label>
            <input
              type="number" min="0.01" max="100" step="0.01"
              value={creditUsd}
              onChange={(e) => setCreditUsd(e.target.value)}
              required
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] w-28"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Max uses</label>
            <input
              type="number" min="1"
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              placeholder="unlimited"
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] w-28"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Telegram launch campaign"
              maxLength={200}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] pb-2.5 cursor-pointer">
            <input type="checkbox" checked={newUsersOnly} onChange={(e) => setNewUsersOnly(e.target.checked)} />
            New users only
          </label>
          <button
            type="submit"
            disabled={creating || !code}
            className="rounded-lg bg-[var(--color-primary)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-40"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-2">
          {creditUsd && Number(creditUsd) > 0 && `$${Number(creditUsd).toFixed(2)} ≈ ${mbEquivalent(creditUsd)} at the $7/GB entry rate. `}
          Tip: create one code per marketing channel (TELEGRAM200, BHW200, ...) to track which converts.
        </p>
      </div>

      {/* List */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">All Codes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                <th className="text-left p-3 font-medium">Code</th>
                <th className="text-left p-3 font-medium">Credit</th>
                <th className="text-left p-3 font-medium">Uses</th>
                <th className="text-left p-3 font-medium">Total Credited</th>
                <th className="text-left p-3 font-medium">Rules</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((p) => (
                <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="p-3">
                    <span className="font-mono font-medium text-[var(--color-text)]">{p.code}</span>
                    {p.description && (
                      <p className="text-xs text-[var(--color-text-muted)]">{p.description}</p>
                    )}
                  </td>
                  <td className="p-3 text-[var(--color-text)]">
                    ${Number(p.credit_usd).toFixed(2)}
                    <span className="text-xs text-[var(--color-text-muted)]"> ({mbEquivalent(p.credit_usd)})</span>
                  </td>
                  <td className="p-3 text-[var(--color-text)]">
                    {p.redemption_count}{p.max_redemptions ? ` / ${p.max_redemptions}` : ''}
                  </td>
                  <td className="p-3 text-[var(--color-text)]">${Number(p.total_credited).toFixed(2)}</td>
                  <td className="p-3 text-xs text-[var(--color-text-muted)]">
                    {p.new_users_only && 'New users · '}
                    {p.per_ip_limit > 0 ? `${p.per_ip_limit}/IP` : 'No IP limit'}
                    {p.expires_at && ` · exp ${new Date(p.expires_at).toLocaleDateString()}`}
                  </td>
                  <td className="p-3">
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: p.active ? '#10b98120' : '#ef444420',
                        color: p.active ? '#10b981' : '#ef4444',
                      }}
                    >
                      {p.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => toggle(p)}
                      className="text-xs text-[var(--color-primary)] hover:underline"
                    >
                      {p.active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
              {promos.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-[var(--color-text-muted)]">
                    No promo codes yet
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
