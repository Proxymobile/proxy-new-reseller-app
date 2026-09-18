'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SyncButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/seo/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        setMsg({ ok: false, text: data.error ?? 'Sync failed' });
      } else {
        setMsg({ ok: true, text: `Synced ${data.rowsSynced} rows` });
        router.refresh();
      }
    } catch {
      setMsg({ ok: false, text: 'Sync request failed' });
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={run}
        disabled={busy || disabled}
        className="rounded-lg bg-[var(--color-text)] px-3 py-1.5 text-xs font-medium text-[var(--color-bg)] transition hover:opacity-90 disabled:opacity-30"
      >
        {busy ? 'Syncing…' : 'Sync from Search Console'}
      </button>
      {msg && (
        <span className={`text-xs ${msg.ok ? 'text-emerald-500' : 'text-red-500'}`} role="status">
          {msg.text}
        </span>
      )}
    </div>
  );
}
