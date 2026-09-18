'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function KeywordManager() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [targetPath, setTargetPath] = useState('');
  const [priority, setPriority] = useState<'high' | 'normal' | 'low'>('normal');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await fetch('/api/admin/seo/keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyword: keyword.trim(),
        targetPath: targetPath.trim() || undefined,
        priority,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Could not add keyword');
      return;
    }
    setKeyword('');
    setTargetPath('');
    setPriority('normal');
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-[var(--color-primary)] hover:underline"
      >
        + Track a keyword
      </button>
    );
  }

  const input = 'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20';

  return (
    <form onSubmit={add} className="mt-3 grid gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 sm:grid-cols-[2fr_1.5fr_auto_auto]">
      <input
        className={input}
        placeholder="e.g. mobile proxy usa"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        maxLength={120}
        required
        autoFocus
        aria-label="Keyword"
      />
      <input
        className={input}
        placeholder="Target page (optional) — /mobile-proxies/us"
        value={targetPath}
        onChange={(e) => setTargetPath(e.target.value)}
        maxLength={200}
        aria-label="Target page"
      />
      <select
        className={input}
        value={priority}
        onChange={(e) => setPriority(e.target.value as 'high' | 'normal' | 'low')}
        aria-label="Priority"
      >
        <option value="high">High</option>
        <option value="normal">Normal</option>
        <option value="low">Low</option>
      </select>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-30"
        >
          {busy ? 'Adding…' : 'Add'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(''); }}
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-500 sm:col-span-4">{error}</p>}
    </form>
  );
}

export function RemoveKeyword({ id, keyword }: { id: string; keyword: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    await fetch(`/api/admin/seo/keywords?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      aria-label={`Stop tracking ${keyword}`}
      className="text-xs text-[var(--color-text-muted)] transition hover:text-red-500 disabled:opacity-40"
    >
      {busy ? '…' : 'Remove'}
    </button>
  );
}
