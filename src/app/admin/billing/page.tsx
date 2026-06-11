'use client';

import { useState, useEffect, useCallback } from 'react';

interface Transaction {
  id: string;
  user_id: string;
  user_label: string;
  user_email: string | null;
  amount_usd: string;
  type: 'credit' | 'debit';
  reason: string;
  reference: string | null;
  payment_method: string;
  invoice_number: string | null;
  created_at: string;
  created_by_label: string | null;
}

interface Stats {
  totalDeposits: number;
  totalPurchases: number;
  stripeDeposits: number;
  adminCredits: number;
  txCount: number;
  uniqueUsers: number;
}

const METHOD_LABELS: Record<string, string> = {
  stripe: 'Stripe',
  admin: 'Admin',
  balance: 'Balance',
  crypto: 'Crypto',
  system: 'System',
};

export default function AdminBillingPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterMethod, setFilterMethod] = useState('');
  const [filterType, setFilterType] = useState('');

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterMethod) params.set('method', filterMethod);
    if (filterType) params.set('type', filterType);
    const res = await fetch(`/api/admin/billing?${params}`);
    if (res.ok) {
      const data = await res.json();
      setTransactions(data.transactions);
      setStats(data.stats);
    }
    setLoading(false);
  }, [filterMethod, filterType]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p className="text-[var(--color-text-muted)]">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">Billing</h1>

      {/* Revenue Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 mb-6">
          <StatCard label="Total Deposits" value={`$${stats.totalDeposits.toFixed(2)}`} accent="green" />
          <StatCard label="Total Purchases" value={`$${stats.totalPurchases.toFixed(2)}`} accent="red" />
          <StatCard label="Stripe Revenue" value={`$${stats.stripeDeposits.toFixed(2)}`} />
          <StatCard label="Admin Credits" value={`$${stats.adminCredits.toFixed(2)}`} />
          <StatCard label="Transactions" value={String(stats.txCount)} />
          <StatCard label="Unique Users" value={String(stats.uniqueUsers)} />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={filterMethod}
          onChange={(e) => { setFilterMethod(e.target.value); setLoading(true); }}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
        >
          <option value="">All Methods</option>
          <option value="stripe">Stripe</option>
          <option value="admin">Admin</option>
          <option value="balance">Balance</option>
          <option value="crypto">Crypto</option>
          <option value="system">System</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setLoading(true); }}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
        >
          <option value="">All Types</option>
          <option value="credit">Deposits (Credit)</option>
          <option value="debit">Purchases (Debit)</option>
        </select>
      </div>

      {/* Transaction Table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                <th className="text-left p-3 font-medium">Invoice</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">User</th>
                <th className="text-left p-3 font-medium">Description</th>
                <th className="text-left p-3 font-medium">Method</th>
                <th className="text-left p-3 font-medium">By</th>
                <th className="text-right p-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)]">
                  <td className="p-3">
                    <span className="text-xs font-mono text-[var(--color-text-muted)]">
                      {tx.invoice_number ?? '-'}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-[var(--color-text-muted)]">
                    {new Date(tx.created_at).toLocaleDateString()}
                    <span className="block text-[10px]">{new Date(tx.created_at).toLocaleTimeString()}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-xs font-medium text-[var(--color-text)]">{tx.user_label}</span>
                    {tx.user_email && (
                      <span className="block text-[10px] text-[var(--color-text-muted)]">{tx.user_email}</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-[var(--color-text)]">{tx.reason}</td>
                  <td className="p-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      tx.payment_method === 'stripe'
                        ? 'bg-purple-50 text-purple-600'
                        : tx.payment_method === 'admin'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-gray-50 text-gray-600'
                    }`}>
                      {METHOD_LABELS[tx.payment_method] ?? tx.payment_method}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-[var(--color-text-muted)]">
                    {tx.created_by_label ?? '-'}
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
                  <td colSpan={7} className="p-6 text-center text-xs text-[var(--color-text-muted)]">
                    No transactions found
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
