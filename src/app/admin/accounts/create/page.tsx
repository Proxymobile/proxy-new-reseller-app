'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CreateAccountPage() {
  const [label, setLabel] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'customer' | 'admin'>('customer');
  const [result, setResult] = useState<{ accessCode: string; label: string } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/admin/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: label.trim(),
        role,
        email: email.trim() || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Failed to create account');
      return;
    }

    const data = await res.json();
    setResult({ accessCode: data.accessCode, label: data.label });
  }

  if (result) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">Account Created</h1>
        <div className="max-w-md">
          <div className="rounded-xl border border-[var(--color-accent)] bg-[var(--color-surface)] p-6">
            <p className="text-sm text-[var(--color-text-muted)] mb-1">Account</p>
            <p className="text-lg text-[var(--color-text)] font-medium mb-4">{result.label}</p>

            <p className="text-sm text-[var(--color-text-muted)] mb-1">Access Code</p>
            <div className="rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] p-4 mb-4">
              <p className="text-2xl font-mono font-bold text-[var(--color-accent)] tracking-wider select-all text-center">
                {result.accessCode}
              </p>
            </div>

            <p className="text-xs text-red-400 mb-6">
              This code will NOT be shown again. Copy and share it with the customer now.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result.accessCode);
                }}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition"
              >
                Copy Code
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setLabel('');
                  setEmail('');
                }}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
              >
                Create Another
              </button>
              <Link
                href="/admin/accounts"
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition"
              >
                View All
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">Create Account</h1>
      <div className="max-w-md">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
                Label *
              </label>
              <input
                id="label"
                type="text"
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                placeholder="e.g. alice, client-47, acme-corp"
              />
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                A human-readable identifier for this account
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
                Email (optional)
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                placeholder="For notifications only"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
                Role
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                    role === 'customer'
                      ? 'border-[var(--color-primary)] text-[var(--color-text)] bg-[var(--color-primary)]/10'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                    role === 'admin'
                      ? 'border-[var(--color-accent)] text-[var(--color-text)] bg-[var(--color-accent)]/10'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading || !label.trim()}
              className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Generate Access Code'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
