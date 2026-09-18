'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/panel/ui';
import { usd } from '@/components/panel/format';

const PRESETS = [10, 25, 50, 100, 250, 500];

export function AddFunds({ firstDeposit, bonus, preset }: { firstDeposit: boolean; bonus: number; preset: number | null }) {
  const [amount, setAmount] = useState(preset && preset >= 5 && preset <= 10000 ? String(preset) : '50');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const value = Number(amount);
  const valid = Number.isFinite(value) && value >= 5 && value <= 10000;

  async function pay() {
    if (!valid) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(value * 100) / 100 }),
      });
      const data = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Could not start checkout');
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start checkout');
      setBusy(false);
    }
  }

  return (
    <div>
      {firstDeposit && (
        <p className="mb-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text)]">
          <span className="font-semibold">Welcome bonus:</span> your first deposit gets {usd(bonus)} extra credit.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAmount(String(p))}
            className={`rounded-lg border px-3.5 py-2 text-sm font-medium tabular-nums transition ${Number(amount) === p ? 'border-[var(--color-text)] bg-[var(--color-surface-hover)] text-[var(--color-text)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
          >
            ${p}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] pl-3">
          <span className="text-sm text-[var(--color-text-muted)]">$</span>
          <input
            type="number" min={5} max={10000} step="1" value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label="Amount in USD"
            className="w-28 bg-transparent px-2 py-2 text-sm font-semibold tabular-nums text-[var(--color-text)] outline-none"
          />
        </label>
        <button
          type="button"
          onClick={pay}
          disabled={!valid || busy}
          className="rounded-lg bg-[var(--color-text)] px-5 py-2 text-sm font-semibold text-[var(--color-bg)] hover:opacity-90 disabled:opacity-40"
        >
          {busy ? 'Opening checkout…' : valid ? `Pay ${usd(value)}${firstDeposit ? ` → get ${usd(value + bonus)}` : ''}` : 'Enter $5 – $10,000'}
        </button>
      </div>
      {error && <div className="mt-3"><Alert level="critical" title={error} /></div>}
      <p className="mt-3 text-[11px] text-[var(--color-text-muted)]">
        Funds stay on your balance until you buy bandwidth — nothing is charged automatically. Minimum $5.
      </p>
    </div>
  );
}

export function RedeemPromo() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string; trial?: boolean } | null>(null);

  async function redeem() {
    if (!code.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch('/api/promo/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
      if (!res.ok) throw new Error(data.error ?? 'Could not redeem this code');
      const trial = !!data.grantedGb;
      setResult({
        ok: true,
        trial,
        text: trial
          ? `${data.grantedGb >= 1 ? `${data.grantedGb} GB` : `${Math.round(data.grantedGb * 1024)} MB`} of trial bandwidth added to your key.`
          : `${usd(Number(data.creditedUsd))} added to your balance.`,
      });
      setCode('');
      router.refresh();
    } catch (e) {
      setResult({ ok: false, text: e instanceof Error ? e.message : 'Could not redeem this code' });
    }
    setBusy(false);
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32))}
          onKeyDown={(e) => { if (e.key === 'Enter') redeem(); }}
          placeholder="e.g. START200"
          aria-label="Promo code"
          spellCheck={false}
          autoComplete="off"
          className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 font-mono text-sm tracking-wider text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
        />
        <button
          type="button"
          onClick={redeem}
          disabled={busy || !code.trim()}
          className="rounded-lg bg-[var(--color-text)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)] hover:opacity-90 disabled:opacity-40"
        >
          {busy ? 'Checking…' : 'Redeem'}
        </button>
      </div>
      {result && (
        <div className="mt-3">
          <Alert level={result.ok ? 'good' : 'critical'} title={result.ok ? 'Code applied' : 'Code not applied'}>
            {result.text}
          </Alert>
          {result.trial && <Link href="/dashboard/keys" className="mt-2 inline-block text-xs font-medium text-[var(--color-primary)] hover:underline">Get your proxy URL →</Link>}
        </div>
      )}
      <p className="mt-3 text-[11px] text-[var(--color-text-muted)]">Each code can be used once per account.</p>
    </div>
  );
}
