'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CreatedKey {
  id: string;
  key: string;
  gb: number;
  expiresAt: string;
  proxyUrl: string | null;
}

export default function CreateKeyPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [gb, setGb] = useState(10);
  const [days, setDays] = useState(30);
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedKey | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    setCreated(null);
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gb, days, label: label.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create key');
      } else {
        setCreated(data.key);
        router.refresh(); // update the table below
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string, which: string) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Create a key for my use</h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Mint a fresh proxy key bound to your admin account.
          </p>
        </div>
        <span className="text-[var(--color-text-muted)] text-lg leading-none">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="border-t border-[var(--color-border)] p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="block text-xs text-[var(--color-text-muted)] mb-1">Bandwidth (GB)</span>
              <input
                type="number" min={1} max={1000} value={gb}
                onChange={(e) => setGb(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-[var(--color-text-muted)] mb-1">Duration (days)</span>
              <input
                type="number" min={1} max={365} value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-[var(--color-text-muted)] mb-1">Label (optional)</span>
              <input
                type="text" value={label} placeholder="admin-self" maxLength={50}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
              />
            </label>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={submit}
              disabled={loading}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Minting…' : 'Create key'}
            </button>
            <span className="text-xs text-[var(--color-text-muted)]">
              Replaces your existing admin key, if any.
            </span>
          </div>

          {error && (
            <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          {created && (
            <div className="mt-4 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 p-4">
              <p className="text-xs font-semibold text-[var(--color-accent)] mb-3">
                Key created — {created.gb} GB, expires {new Date(created.expiresAt).toLocaleDateString()}
              </p>

              <KeyField label="Key ID" value={created.id} onCopy={() => copy(created.id, 'id')} copied={copied === 'id'} />
              <KeyField label="Key (secret)" value={created.key} onCopy={() => copy(created.key, 'key')} copied={copied === 'key'} mono />
              {created.proxyUrl && (
                <KeyField
                  label="Proxy URL (US · sticky)"
                  value={created.proxyUrl}
                  onCopy={() => copy(created.proxyUrl!, 'url')}
                  copied={copied === 'url'}
                  mono
                />
              )}
              <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
                Save the secret now — it is shown in full only here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function KeyField({
  label, value, onCopy, copied, mono,
}: {
  label: string; value: string; onCopy: () => void; copied: boolean; mono?: boolean;
}) {
  return (
    <div className="mb-2">
      <span className="block text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">{label}</span>
      <div className="flex items-center gap-2">
        <code className={`flex-1 min-w-0 truncate rounded bg-[var(--color-bg)] border border-[var(--color-border)] px-2 py-1.5 text-xs text-[var(--color-text)] ${mono ? 'font-mono' : ''}`}>
          {value}
        </code>
        <button
          onClick={onCopy}
          className="shrink-0 rounded border border-[var(--color-border)] px-2 py-1.5 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
