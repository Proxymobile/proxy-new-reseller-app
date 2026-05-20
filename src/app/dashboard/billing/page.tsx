'use client';

import { useState, useEffect, useCallback } from 'react';

interface Transaction {
  id: string;
  amount_usd: string;
  type: 'credit' | 'debit';
  reason: string;
  reference: string | null;
  payment_method: string;
  invoice_number: string | null;
  created_at: string;
}

interface Stats {
  totalDeposits: number;
  totalPurchases: number;
  txCount: number;
  balance: number;
}

const DEPOSIT_PRESETS = [25, 50, 100, 250, 500, 1000];

const METHOD_LABELS: Record<string, string> = {
  stripe: 'Stripe',
  admin: 'Admin',
  balance: 'Balance',
  crypto: 'Crypto',
  system: 'System',
};

export default function BillingPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/billing');
    if (res.ok) {
      const data = await res.json();
      setTransactions(data.transactions);
      setStats(data.stats);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // Check for Stripe redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('deposit') === 'success') {
      setMessage({ type: 'success', text: 'Deposit successful! Your balance has been credited.' });
      window.history.replaceState({}, '', '/dashboard/billing');
    } else if (params.get('deposit') === 'cancelled') {
      setMessage({ type: 'error', text: 'Deposit cancelled.' });
      window.history.replaceState({}, '', '/dashboard/billing');
    }
  }, [load]);

  async function handleStripeDeposit() {
    const amount = Number(depositAmount);
    if (!amount || amount < 5 || amount > 10000) {
      setMessage({ type: 'error', text: 'Amount must be between $5 and $10,000' });
      return;
    }
    setDepositLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create checkout');
      if (data.url) window.location.href = data.url;
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Deposit failed' });
      setDepositLoading(false);
    }
  }

  if (loading) return <p className="text-[var(--color-text-muted)]">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">Billing</h1>

      {message && (
        <div className={`rounded-lg border p-3 mb-4 text-sm ${
          message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-600'
        }`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right text-xs opacity-60 hover:opacity-100">&times;</button>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <StatCard label="Balance" value={`$${stats.balance.toFixed(2)}`} />
          <StatCard label="Total Deposited" value={`$${stats.totalDeposits.toFixed(2)}`} accent="green" />
          <StatCard label="Total Spent" value={`$${stats.totalPurchases.toFixed(2)}`} accent="red" />
          <StatCard label="Transactions" value={String(stats.txCount)} />
        </div>
      )}

      {/* Deposit */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 mb-6">
        <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3">Add Funds</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {DEPOSIT_PRESETS.map((amt) => (
            <button
              key={amt}
              onClick={() => setDepositAmount(String(amt))}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                depositAmount === String(amt)
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]'
              }`}
            >
              ${amt}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)]">$</span>
            <input
              type="number"
              min={5}
              max={10000}
              step="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] pl-7 pr-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>
          <button
            onClick={handleStripeDeposit}
            disabled={depositLoading || !depositAmount || Number(depositAmount) < 5}
            className="rounded-lg bg-[var(--color-primary)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-40"
          >
            {depositLoading ? 'Redirecting...' : 'Pay with Stripe'}
          </button>
        </div>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-2">
          Minimum deposit: $5. Funds are credited instantly after payment.
        </p>
      </div>

      {/* Transaction History */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Transaction History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                <th className="text-left p-3 font-medium">Invoice</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Description</th>
                <th className="text-left p-3 font-medium">Method</th>
                <th className="text-right p-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="p-3">
                    <span className="text-xs font-mono text-[var(--color-text-muted)]">
                      {tx.invoice_number ?? '-'}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-[var(--color-text-muted)]">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-xs text-[var(--color-text)]">{tx.reason}</td>
                  <td className="p-3">
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {METHOD_LABELS[tx.payment_method] ?? tx.payment_method}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span className={`text-xs font-medium ${
                      tx.type === 'credit' ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {tx.type === 'credit' ? '+' : '-'}${Number(tx.amount_usd).toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-xs text-[var(--color-text-muted)]">
                    No transactions yet
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
