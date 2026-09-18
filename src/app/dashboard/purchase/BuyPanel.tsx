'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { customGbPrice, customGbRatePerGB, CUSTOM_MIN_GB, CUSTOM_MAX_GB, type GbTier } from '@/lib/pricing';
import { Alert, Card } from '@/components/panel/ui';
import { gb, usd } from '@/components/panel/format';

const ENTRY_RATE = customGbRatePerGB(1);

export function BuyPanel({ balance, hasKey, leftGb, expiresAt, expired, tiers, durationDays }: {
  balance: number;
  hasKey: boolean;
  leftGb: number | null;
  expiresAt: string | null;
  expired: boolean;
  tiers: GbTier[];
  durationDays: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(() => {
    // Start at 10 GB, or the most the current balance covers
    if (balance >= customGbPrice(10)) return 10;
    let best = 10;
    for (let g = CUSTOM_MIN_GB; g < 10; g++) if (customGbPrice(g) <= balance) best = g;
    return best;
  });
  const [step, setStep] = useState<'pick' | 'confirm' | 'buying' | 'done'>('pick');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ gb: number; price: number; balance: number; validUntil: Date } | null>(null);

  const price = customGbPrice(amount);
  const rate = customGbRatePerGB(amount);
  const saving = Math.max(0, amount * ENTRY_RATE - price);
  const shortfall = Math.max(0, price - balance);
  const topUp = Math.max(5, Math.ceil(shortfall));
  const base = expiresAt && !expired ? Math.max(Date.now(), Date.parse(expiresAt)) : Date.now();
  const newExpiry = new Date(base + durationDays * 86_400_000);
  const newTotal = (expired ? 0 : leftGb ?? 0) + amount;

  function set(v: number) {
    setAmount(Math.max(CUSTOM_MIN_GB, Math.min(CUSTOM_MAX_GB, Math.round(v) || CUSTOM_MIN_GB)));
    setStep('pick');
    setError('');
  }

  async function buy() {
    setStep('buying');
    setError('');
    try {
      const res = await fetch('/api/balance/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gb: amount }),
      });
      const data = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
      if (!res.ok) throw new Error(data.error ?? 'Purchase failed');
      setResult({ gb: amount, price: data.purchased?.priceUsd ?? price, balance: Number(data.balance ?? 0), validUntil: newExpiry });
      setStep('done');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Purchase failed');
      setStep('confirm');
    }
  }

  if (step === 'done' && result) {
    return (
      <Card>
        <div className="py-6 text-center">
          <p className="text-3xl" aria-hidden>✓</p>
          <p className="mt-2 text-lg font-semibold text-[var(--color-text)]">{gb(result.gb)} added to your key</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Paid {usd(result.price)} · balance now {usd(result.balance)} · valid until {result.validUntil.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/dashboard/keys" className="rounded-lg bg-[var(--color-text)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)]">Get proxy URLs</Link>
            <button onClick={() => { setStep('pick'); setResult(null); }} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text)]">Buy more</button>
          </div>
        </div>
      </Card>
    );
  }

  const pct = ((amount - CUSTOM_MIN_GB) / (CUSTOM_MAX_GB - CUSTOM_MIN_GB)) * 100;

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card title="How much do you need?" subtitle="Choose any amount from 1 to 100 GB" className="lg:col-span-3">
        <div className="flex flex-wrap gap-2">
          {tiers.map((t) => (
            <button
              key={t.gb}
              onClick={() => set(t.gb)}
              className={`rounded-xl border px-3 py-2 text-left transition ${amount === t.gb ? 'border-[var(--color-text)] bg-[var(--color-surface-hover)]' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/40'}`}
            >
              <span className="block text-sm font-semibold text-[var(--color-text)]">{t.gb} GB</span>
              <span className="block text-[11px] tabular-nums text-[var(--color-text-muted)]">{usd(t.perGb)}/GB</span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-end gap-4">
          <label className="block">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Custom amount</span>
            <span className="mt-1 flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] pr-3">
              <input
                type="number"
                min={CUSTOM_MIN_GB}
                max={CUSTOM_MAX_GB}
                value={amount}
                onChange={(e) => set(Number(e.target.value))}
                className="w-24 bg-transparent px-3 py-2 text-lg font-semibold tabular-nums text-[var(--color-text)] outline-none"
              />
              <span className="text-sm text-[var(--color-text-muted)]">GB</span>
            </span>
          </label>
          <p className="pb-2 text-sm text-[var(--color-text-muted)]">
            <span className="font-semibold text-[var(--color-text)]">{usd(rate)}</span> per GB
            {saving > 0 && <> · you save <span className="font-semibold text-[var(--viz-good-text)]">{usd(saving)}</span></>}
          </p>
        </div>

        <div className="viz mt-5">
          <input
            type="range"
            min={CUSTOM_MIN_GB}
            max={CUSTOM_MAX_GB}
            value={amount}
            onChange={(e) => set(Number(e.target.value))}
            aria-label="Bandwidth in GB"
            aria-valuetext={`${amount} GB for ${usd(price)}`}
            className="w-full accent-[var(--color-primary)]"
            style={{ background: `linear-gradient(to right, var(--viz-1) ${pct}%, transparent ${pct}%)`, borderRadius: 9999, height: 6 }}
          />
          <div className="mt-1 flex justify-between text-[10px] tabular-nums text-[var(--color-text-muted)]">
            <span>1 GB</span><span>25 GB</span><span>50 GB</span><span>100 GB</span>
          </div>
        </div>
      </Card>

      <Card title="Summary" className="lg:col-span-2">
        <dl className="space-y-2.5 text-sm">
          <Row label="Bandwidth" value={gb(amount)} />
          <Row label="Rate" value={`${usd(rate)} / GB`} />
          {saving > 0 && <Row label="Volume saving" value={`− ${usd(saving)}`} />}
          <div className="border-t border-[var(--color-border)] pt-2.5">
            <Row label="Total" value={<span className="text-xl font-semibold">{usd(price)}</span>} />
          </div>
          <Row label="Balance after" value={shortfall > 0 ? '—' : usd(balance - price)} muted />
          <Row label={hasKey ? 'Data after purchase' : 'Your new key'} value={gb(newTotal)} muted />
          <Row label="Valid until" value={newExpiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} muted />
        </dl>

        {error && <div className="mt-4"><Alert level="critical" title={error} /></div>}

        <div className="mt-5">
          {shortfall > 0 ? (
            <>
              <p className="mb-2 text-xs text-[var(--color-text-muted)]">You need {usd(shortfall)} more for this purchase.</p>
              <Link href={`/dashboard/billing?amount=${topUp}`} className="block w-full rounded-lg bg-[var(--color-text)] py-2.5 text-center text-sm font-semibold text-[var(--color-bg)] hover:opacity-90">
                Add {usd(topUp, { cents: false })} to balance
              </Link>
            </>
          ) : step === 'pick' ? (
            <button onClick={() => setStep('confirm')} className="w-full rounded-lg bg-[var(--color-text)] py-2.5 text-sm font-semibold text-[var(--color-bg)] hover:opacity-90">
              Buy {gb(amount)} for {usd(price)}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-[var(--color-text)]">{usd(price)} will be taken from your balance. {hasKey ? 'Your existing proxy URLs keep working.' : 'Your key is created instantly.'}</p>
              <div className="flex gap-2">
                <button onClick={buy} disabled={step === 'buying'} className="flex-1 rounded-lg bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
                  {step === 'buying' ? 'Processing…' : 'Confirm purchase'}
                </button>
                <button onClick={() => setStep('pick')} disabled={step === 'buying'} className="rounded-lg border border-[var(--color-border)] px-3 text-sm text-[var(--color-text)]">Back</button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: React.ReactNode; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[var(--color-text-muted)]">{label}</dt>
      <dd className={`tabular-nums ${muted ? 'text-[var(--color-text-muted)]' : 'font-medium text-[var(--color-text)]'}`}>{value}</dd>
    </div>
  );
}
