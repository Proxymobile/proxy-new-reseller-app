'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { config } from '@/config';
import { customGbPrice, customGbRatePerGB, CUSTOM_MIN_GB, CUSTOM_MAX_GB } from '@/lib/pricing';

const COUNTRIES = [
  { code: 'us', name: 'USA', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'de', name: 'Germany', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'gb', name: 'UK', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: 'fr', name: 'France', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'es', name: 'Spain', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'pl', name: 'Poland', flag: '\u{1F1F5}\u{1F1F1}' },
  { code: 'ch', name: 'Switzerland', flag: '\u{1F1E8}\u{1F1ED}' },
  { code: 'pa', name: 'Panama', flag: '\u{1F1F5}\u{1F1E6}' },
  { code: 'am', name: 'Armenia', flag: '\u{1F1E6}\u{1F1F2}' },
];

const INCLUDED_FEATURES = [
  'Real 4G/5G mobile devices',
  'All 9 countries unlocked',
  'HTTP & SOCKS5 protocols',
  'All rotation modes',
  'Unlimited parallel sessions',
];

const USE_CASES = [
  'Multi-account management',
  'Web scraping without bans',
  'Geo-specific content access',
  'Social media automation',
];

function Check({ className = 'h-3.5 w-3.5 text-[var(--color-accent)]' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SearchIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
    </svg>
  );
}

function ArrowIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

interface BuyConfiguratorProps {
  title?: string;
  subtitle?: string;
}

export function BuyConfigurator({ title, subtitle }: BuyConfiguratorProps) {
  const [country, setCountry] = useState('us');
  const [planId, setPlanId] = useState<string>(config.pricing[1]?.id ?? config.pricing[0].id);
  const [pool, setPool] = useState<'mbl' | 'peer'>('mbl');
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [sliderGB, setSliderGB] = useState<number>(config.pricing[1]?.gb ?? 25);

  // Sync slider when plan card clicked
  useEffect(() => {
    const p = config.pricing.find((x) => x.id === planId);
    if (p && p.gb !== sliderGB) setSliderGB(p.gb);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  function handleSliderChange(val: number) {
    setSliderGB(val);
    // Auto-select smallest plan that covers the GB amount
    const sorted = [...config.pricing].sort((a, b) => a.gb - b.gb);
    const match = sorted.find((p) => p.gb >= val) ?? sorted[sorted.length - 1];
    if (match.id !== planId) setPlanId(match.id);
  }

  useEffect(() => {
    fetch('/api/balance')
      .then((r) => r.json())
      .then((d) => setBalance(Number(d.balance ?? 0)))
      .catch(() => setBalance(0));
  }, []);

  const plan = config.pricing.find((p) => p.id === planId) ?? config.pricing[0];
  const ctry = COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0];

  // Slider GB is the source of truth for purchase
  const totalPrice = customGbPrice(sliderGB);
  const ratePerGB = customGbRatePerGB(sliderGB);
  const baseRate = config.pricing[0].priceUsd / config.pricing[0].gb; // $7/GB (Starter rate)
  const undiscountedPrice = Math.round(sliderGB * baseRate);
  const savings = undiscountedPrice - totalPrice;
  const savingsPct = undiscountedPrice > 0 ? Math.round((savings / undiscountedPrice) * 100) : 0;
  const canAfford = balance !== null && balance >= totalPrice;

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.includes(q));
  }, [search]);

  async function handleBuy() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/balance/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gb: sliderGB }),
      });
      const data = await res.json();
      if (res.ok) {
        setBalance(Number(data.balance ?? 0));
        setMessage({ type: 'success', text: `Activated! ${sliderGB} GB added to your account. Visit Keys to start generating proxies.` });
      } else {
        setMessage({ type: 'error', text: data.error ?? 'Purchase failed' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
    setLoading(false);
  }

  return (
    <div>
      {(title || subtitle) && (
        <div className="mb-5">
          {title && <h2 className="text-xl font-bold text-[var(--color-text)] tracking-tight">{title}</h2>}
          {subtitle && <p className="text-sm text-[var(--color-text-muted)] mt-1">{subtitle}</p>}
        </div>
      )}

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className={`rounded-xl border p-3.5 text-sm flex items-start gap-3 ${
              message.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}>
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 ${
                message.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
              }`}>
                {message.type === 'success' ? (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{message.text}</p>
                {message.type === 'success' && (
                  <Link href="/dashboard/keys" className="inline-flex items-center gap-1 mt-1 text-xs font-medium underline">
                    Open Keys <ArrowIcon className="w-3 h-3" />
                  </Link>
                )}
              </div>
              <button
                onClick={() => setMessage(null)}
                className="text-xs opacity-60 hover:opacity-100 shrink-0"
                aria-label="Dismiss"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* COLUMN 1 — Location */}
        <div className="lg:col-span-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold">
                Step 1 · Location
              </p>
              <h3 className="text-sm font-semibold text-[var(--color-text)] mt-0.5">
                Select country
              </h3>
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)]">
              {filteredCountries.length} / {COUNTRIES.length}
            </span>
          </div>

          <div className="p-5">
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                <SearchIcon className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search countries..."
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] pl-9 pr-9 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/60 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  aria-label="Clear search"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 max-h-[420px] overflow-y-auto pr-0.5">
              {filteredCountries.map((c) => {
                const selected = country === c.code;
                return (
                  <motion.button
                    key={c.code}
                    onClick={() => setCountry(c.code)}
                    whileTap={{ scale: 0.97 }}
                    className={`relative rounded-xl border p-3 text-left transition-all ${
                      selected
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-2 ring-[var(--color-primary)]/20 shadow-sm'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)] hover:border-[var(--color-primary)]/40 hover:-translate-y-0.5 hover:shadow-sm'
                    }`}
                  >
                    {selected && (
                      <span className="absolute top-1.5 left-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
                        <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                    <div className="text-2xl leading-none mb-1.5 mt-1">{c.flag}</div>
                    <p className="text-[11px] font-bold text-[var(--color-text)] uppercase tracking-wider">{c.code}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] truncate mt-0.5">{c.name}</p>
                  </motion.button>
                );
              })}
              {filteredCountries.length === 0 && (
                <div className="col-span-3 rounded-xl border border-dashed border-[var(--color-border)] py-10 text-center">
                  <p className="text-xs text-[var(--color-text-muted)]">No countries match &ldquo;{search}&rdquo;</p>
                  <button
                    onClick={() => setSearch('')}
                    className="text-[11px] text-[var(--color-primary)] hover:underline mt-1.5"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 2 — Plan + Pool + Features */}
        <div className="lg:col-span-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <div className="px-5 py-4 border-b border-[var(--color-border)]">
            <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold">
              Step 2 · Configuration
            </p>
            <h3 className="text-sm font-semibold text-[var(--color-text)] mt-0.5">
              Choose plan & pool
            </h3>
          </div>

          <div className="p-5 space-y-5">
            {/* Plan picker */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold mb-2.5">
                Plan
              </p>
              <div className="space-y-2">
                {config.pricing.map((p, i) => {
                  const selected = planId === p.id;
                  const isFeatured = i === 1; // Pro
                  const ratePerGb = p.priceUsd / p.gb;
                  const fullPriceP = Math.round(p.gb * baseRate);
                  const savingsP = fullPriceP - p.priceUsd;
                  const savingsPctP = Math.round((savingsP / fullPriceP) * 100);
                  return (
                    <motion.button
                      key={p.id}
                      onClick={() => setPlanId(p.id)}
                      whileTap={{ scale: 0.99 }}
                      className={`relative w-full rounded-xl border p-4 text-left transition-all ${
                        selected
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-2 ring-[var(--color-primary)]/20 shadow-sm'
                          : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-bg)] hover:shadow-sm'
                      }`}
                    >
                      {isFeatured && !selected && (
                        <span className="absolute -top-2 right-4 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white shadow-sm">
                          Popular
                        </span>
                      )}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 mt-0.5 transition ${
                              selected
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                                : 'border-[var(--color-border)]'
                            }`}
                          >
                            {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--color-text)]">{p.displayName}</p>
                            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                              {p.gb} GB · {p.durationDays} days
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base font-bold text-[var(--color-text)] tabular-nums">${p.priceUsd}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)] tabular-nums">${ratePerGb.toFixed(2)}/GB</p>
                        </div>
                      </div>
                      {savingsPctP > 0 && (
                        <span className="inline-block mt-2 rounded-md bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          Save {savingsPctP}% vs Starter rate
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Custom GB slider */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold">
                  Custom amount
                </p>
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  Auto-matches a plan
                </span>
              </div>
              <div className="rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] p-4">
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <span className="text-2xl font-bold text-[var(--color-text)] tabular-nums">{sliderGB}</span>
                    <span className="text-sm font-medium text-[var(--color-text-muted)] ml-1">GB</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold">
                      Total cost
                    </p>
                    <p className="text-base font-bold text-[var(--color-primary)] tabular-nums">
                      ${totalPrice}
                    </p>
                  </div>
                </div>

                <input
                  type="range"
                  min={CUSTOM_MIN_GB}
                  max={CUSTOM_MAX_GB}
                  step={1}
                  value={sliderGB}
                  onChange={(e) => handleSliderChange(Number(e.target.value))}
                  className="w-full accent-[var(--color-primary)] cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${sliderGB}%, var(--color-border) ${sliderGB}%, var(--color-border) 100%)`,
                    height: '6px',
                    borderRadius: '999px',
                    appearance: 'none',
                  }}
                />

                <div className="flex justify-between text-[9px] text-[var(--color-text-muted)] mt-2 font-mono">
                  <span>0</span>
                  <span>5</span>
                  <span>25</span>
                  <span>50</span>
                  <span>100</span>
                </div>

                <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-[11px]">
                  <span className="text-[var(--color-text-muted)]">Per GB rate</span>
                  <span className="text-[var(--color-text)] font-semibold tabular-nums">
                    ${ratePerGB.toFixed(2)} <span className="text-[var(--color-text-muted)] font-normal">/ GB</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Pool toggle — segmented control */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold mb-2.5">
                Pool type
              </p>
              <div className="relative grid grid-cols-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] p-1">
                <motion.div
                  layout
                  className="absolute top-1 bottom-1 rounded-lg bg-[var(--color-surface)] shadow-sm"
                  style={{
                    left: pool === 'mbl' ? '4px' : 'calc(50% + 0px)',
                    width: 'calc(50% - 4px)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
                {[
                  { value: 'mbl' as const, label: 'Mobile', desc: '4G/5G modems' },
                  { value: 'peer' as const, label: 'Residential', desc: 'Home ISPs' },
                ].map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPool(p.value)}
                    className={`relative z-10 py-2 text-xs font-semibold transition-colors ${
                      pool === p.value
                        ? 'text-[var(--color-text)]'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {p.label}
                    <span className="block text-[9px] font-normal opacity-60 mt-0.5">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Included features */}
            <div className="rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] p-4">
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold mb-2.5">
                Included with every plan
              </p>
              <ul className="space-y-2">
                {INCLUDED_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-[var(--color-text)]">
                    <Check className="h-3.5 w-3.5 mt-0.5 text-emerald-600" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* COLUMN 3 — Order Summary (light premium card) */}
        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-24 rounded-2xl bg-gradient-to-b from-[var(--color-primary)]/5 via-[var(--color-surface)] to-[var(--color-surface)] border border-[var(--color-border)] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[var(--color-border)]">
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold">
                Step 3 · Review
              </p>
              <h3 className="text-sm font-semibold text-[var(--color-text)] mt-0.5">
                Order summary
              </h3>
            </div>

            <div className="p-5 flex flex-col">
              {/* Selection */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${country}-${planId}-${pool}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-2xl leading-none">
                      {ctry.flag}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold">Country</p>
                      <p className="text-sm font-semibold text-[var(--color-text)] truncate">{ctry.name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-2">
                      <p className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold">Bandwidth</p>
                      <p className="text-xs font-semibold text-[var(--color-text)] mt-0.5 tabular-nums">{sliderGB} GB</p>
                    </div>
                    <div className="rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-2">
                      <p className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold">Type</p>
                      <p className="text-xs font-semibold text-[var(--color-text)] mt-0.5">{pool === 'mbl' ? 'Mobile' : 'Residential'}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Price breakdown */}
              <div className="mt-5 pt-5 border-t border-[var(--color-border)] space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[var(--color-text-muted)]">
                  <span>Bandwidth</span>
                  <span className="text-[var(--color-text)] font-medium tabular-nums">{sliderGB} GB</span>
                </div>
                <div className="flex items-center justify-between text-[var(--color-text-muted)]">
                  <span>Duration</span>
                  <span className="text-[var(--color-text)] font-medium tabular-nums">30 days</span>
                </div>
                <div className="flex items-center justify-between text-[var(--color-text-muted)]">
                  <span>Per GB rate</span>
                  <span className="text-[var(--color-text)] font-medium tabular-nums">${ratePerGB.toFixed(2)}</span>
                </div>
                {savings > 0 && (
                  <div className="flex items-center justify-between text-emerald-600">
                    <span>Volume discount</span>
                    <span className="font-medium tabular-nums">−${savings} ({savingsPct}%)</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] font-semibold">Total</span>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={totalPrice}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-baseline gap-2"
                    >
                      {savings > 0 && (
                        <span className="text-sm text-[var(--color-text-muted)] line-through tabular-nums">${undiscountedPrice}</span>
                      )}
                      <span className="text-3xl font-bold tracking-tight text-[var(--color-text)] tabular-nums">${totalPrice}</span>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Buy button */}
              <button
                onClick={handleBuy}
                disabled={loading || !canAfford}
                className="mt-5 w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold text-white hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-[var(--color-primary)]/20"
              >
                {loading ? (
                  <>
                    <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Processing...
                  </>
                ) : !canAfford ? (
                  'Insufficient Balance'
                ) : (
                  <>
                    Buy Mobile Proxy
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Balance + add funds */}
              {balance !== null && (
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="text-[var(--color-text-muted)]">Your balance:</span>
                  <span className="text-[var(--color-text)] font-semibold tabular-nums">${balance.toFixed(2)}</span>
                </div>
              )}
              {balance !== null && !canAfford && (
                <Link
                  href="/dashboard/billing"
                  className="mt-2 block text-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 text-[11px] font-medium text-[var(--color-primary)] hover:bg-[var(--color-bg)] transition"
                >
                  + Add Funds (need ${(totalPrice - balance).toFixed(2)} more)
                </Link>
              )}

              {/* Money-back */}
              <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5 flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-[11px] font-medium text-emerald-700">7-day money-back guarantee</span>
              </div>

              {/* Perfect for */}
              <div className="mt-5 pt-5 border-t border-[var(--color-border)]">
                <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold mb-3">
                  Perfect for
                </p>
                <ul className="space-y-2">
                  {USE_CASES.map((u) => (
                    <li key={u} className="flex items-start gap-2 text-[11px] text-[var(--color-text-muted)]">
                      <Check className="h-3 w-3 mt-0.5 text-[var(--color-primary)]" />
                      {u}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
