'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BuyConfigurator } from '../_components/BuyConfigurator';
import { IconWallet, IconShield, IconClock, IconCheck } from '../_components/icons';

export default function PurchasePage() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/balance')
      .then((r) => r.json())
      .then((d) => setBalance(Number(d.balance ?? 0)))
      .catch(() => setBalance(0));
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-1.5">
              Purchase
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">
              Configure & Buy Mobile Proxies
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-xl">
              Select your country, choose a plan, and pick your pool type. Your access key activates instantly after purchase.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Top stats — balance + trust pills */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-[var(--color-border)]">
          {/* Balance — primary, with Add Funds button */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-[var(--color-primary)]/5 via-[var(--color-surface)] to-[var(--color-surface)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                    <IconWallet className="h-4 w-4" />
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold">
                    Your Balance
                  </p>
                </div>
                <p className="text-2xl font-bold text-[var(--color-text)] tabular-nums">
                  {balance !== null ? `$${balance.toFixed(2)}` : '—'}
                </p>
              </div>
              <Link
                href="/dashboard/billing"
                className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-[11px] font-semibold text-white hover:opacity-90 transition shadow-sm shadow-[var(--color-primary)]/25"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                </svg>
                Add Funds
              </Link>
            </div>
          </div>

          <TrustPill
            icon={<IconShield className="h-4 w-4" />}
            title="Secure"
            desc="Stripe + bank-grade encryption"
          />
          <TrustPill
            icon={<IconClock className="h-4 w-4" />}
            title="Instant"
            desc="Key activates the moment you pay"
          />
          <TrustPill
            icon={<IconCheck className="h-4 w-4" />}
            title="Money-back"
            desc="7-day guarantee on first purchase"
          />
        </div>
      </motion.div>

      {/* Configurator */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <BuyConfigurator />
      </motion.div>
    </div>
  );
}

function TrustPill({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-4 sm:p-5 flex items-start gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg)] text-[var(--color-text-muted)]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 leading-snug">{desc}</p>
      </div>
    </div>
  );
}
