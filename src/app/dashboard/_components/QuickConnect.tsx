'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CopyButton } from '@/components/panel/CopyButton';
import { countryInfo } from '@/lib/country-list';
import { formatProxy, maskSecret, type ProxyProtocol, type Rotation } from '@/lib/proxy-url';
import { loadPrefs } from './prefs';

/** Ready-to-copy connection string with the three settings people change most. */
export function QuickConnect({ username, secret, countries, disabled }: {
  username: string;
  secret: string;
  countries: { code: string; online: number }[];
  disabled?: boolean;
}) {
  const [country, setCountry] = useState(countries[0]?.code ?? 'us');
  const [protocol, setProtocol] = useState<ProxyProtocol>('http');
  const [rotation, setRotation] = useState<Rotation>('sticky');
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    const p = loadPrefs();
    if (countries.some((c) => c.code === p.country)) setCountry(p.country);
    setProtocol(p.protocol);
    setRotation(p.rotation === 'auto10' ? 'auto10' : 'sticky');
  }, [countries]);

  const url = useMemo(
    () => formatProxy(username, secret, { country, pool: 'mbl', rotation, protocol }),
    [username, secret, country, rotation, protocol],
  );
  const curl = `curl -x "${url}" https://api.ipify.org?format=json`;

  return (
    <div className={disabled ? 'pointer-events-none opacity-50' : ''}>
      <div className="flex flex-wrap gap-2">
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          aria-label="Country"
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-xs text-[var(--color-text)]"
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {countryInfo(c.code).flag} {countryInfo(c.code).name}{c.online ? ` · ${c.online} online` : ' · no stock'}
            </option>
          ))}
        </select>
        <Segmented
          value={protocol}
          onChange={setProtocol}
          options={[{ value: 'http', label: 'HTTP' }, { value: 'socks5', label: 'SOCKS5' }]}
        />
        <Segmented
          value={rotation}
          onChange={setRotation}
          options={[{ value: 'sticky', label: 'Sticky' }, { value: 'auto10', label: 'Rotate 10m' }]}
        />
      </div>

      <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
        <code className="block break-all font-mono text-[11px] leading-relaxed text-[var(--color-text)]">
          {reveal ? url : maskSecret(url, secret)}
        </code>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <CopyButton text={url} label="Copy proxy URL" variant="solid" />
          <CopyButton text={curl} label="Copy curl test" variant="outline" />
          <button type="button" onClick={() => setReveal((r) => !r)} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            {reveal ? 'Hide key' : 'Show key'}
          </button>
          <Link href="/dashboard/keys" className="ml-auto text-xs font-medium text-[var(--color-primary)] hover:underline">
            More options →
          </Link>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
        Mobile pool. Treat this URL like a password — it contains your key.
      </p>
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options, size = 'sm' }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string; hint?: string }[]; size?: 'sm' | 'md';
}) {
  return (
    <div role="radiogroup" className="inline-flex flex-wrap rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md font-medium transition ${size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'} ${
            value === o.value
              ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          {o.label}
          {o.hint && <span className="ml-1 text-[10px] opacity-60">{o.hint}</span>}
        </button>
      ))}
    </div>
  );
}
