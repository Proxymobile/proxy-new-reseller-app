'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GATEWAY_HOST,
  HTTP_PORT,
  SOCKS5_PORT,
  NETWORKS,
  OUTPUT_FORMATS,
  ROTATIONS,
  buildCredentials,
  codeSnippets,
  formatCredentials,
  newSessionId,
  rotationOption,
  sanitizeSessionPrefix,
  stockFor,
  type Network,
  type OutputFormat,
  type Protocol,
  type ProxyCredentials,
} from '@/lib/routing';
import type { RotationMode } from '@proxies-sx/pool-sdk';

// ─── Types ──────────────────────────────────────────────────────────────────

interface KeyData {
  id: string;
  key: string;
  enabled: boolean;
  trafficCapGB: number | null;
  trafficUsedMB: number;
  trafficUsedGB?: number;
  expiresAt: string | null;
  isExpired?: boolean;
  lastUsedAt: string | null;
}

interface CountryInventory {
  code: string;
  modem: number;
  peerMobile: number;
  residential: number;
  mobile: number;
  carriers: string[];
}

interface LiveSession {
  sessionKey: string;
  sessionId: string;
  pool: string;
  country: string;
  carrier: string;
  rotation: string;
  lastActivityAt: number;
  requestCount: number;
  bytesIn: number;
  bytesOut: number;
}

type KeyStatus = 'active' | 'paused' | 'exhausted' | 'expired';

// Shown only if live inventory can't be loaded — countries with a long record
// of real mobile stock, so the builder still works during an upstream blip.
// The first six have dedicated carrier modems.
const FALLBACK_MOBILE = ['us', 'gb', 'fr', 'de', 'es', 'it', 'nl', 'pl', 'br', 'mx'];
const FALLBACK_MODEM = ['us', 'gb', 'fr', 'nl', 'pl', 'ge'];

// ─── Helpers ────────────────────────────────────────────────────────────────

const regionNames = typeof Intl !== 'undefined' && 'DisplayNames' in Intl
  ? new Intl.DisplayNames(['en'], { type: 'region' })
  : null;

function countryName(code: string): string {
  try {
    return regionNames?.of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

function flag(code: string): string {
  if (!/^[a-z]{2}$/i.test(code)) return '';
  return String.fromCodePoint(...code.toUpperCase().split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function copyText(text: string): void {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    return;
  }
  fallbackCopy(text);
}

function fallbackCopy(text: string): void {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch { /* ignore */ }
  document.body.removeChild(ta);
}

function downloadText(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text + '\n'], { type: 'text/plain' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function keyStatus(key: KeyData, usedGB: number): KeyStatus {
  const expired = key.isExpired || (key.expiresAt ? new Date(key.expiresAt).getTime() < Date.now() : false);
  if (expired) return 'expired';
  if (key.trafficCapGB != null && usedGB >= key.trafficCapGB) return 'exhausted';
  if (!key.enabled) return 'paused';
  return 'active';
}

const STATUS_META: Record<KeyStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  paused: { label: 'Paused', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  exhausted: { label: 'Out of traffic', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30' },
  expired: { label: 'Expired', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30' },
};

// ─── Small UI pieces ────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] ${className}`}>
      {children}
    </section>
  );
}

function StepLabel({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2.5">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[10px] text-[var(--color-primary)]">{n}</span>
      {children}
    </p>
  );
}

function CopyButton({ text, label = 'Copy', className = '' }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        copyText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className={`shrink-0 rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-xs font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-surface-hover)] ${className}`}
    >
      {copied ? 'Copied ✓' : label}
    </button>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string }[];
}) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`rounded-xl border px-3 py-2.5 text-left transition ${
            value === o.value
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-1 ring-[var(--color-primary)]/25'
              : 'border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]'
          }`}
        >
          <span className={`block text-sm font-semibold ${value === o.value ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>
            {o.label}
          </span>
          {o.hint && <span className="block text-[11px] text-[var(--color-text-muted)] mt-0.5">{o.hint}</span>}
        </button>
      ))}
    </div>
  );
}

function Field({ label, value, secret = false }: { label: string; value: string; secret?: boolean }) {
  const [shown, setShown] = useState(!secret);
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{label}</span>
        <div className="flex items-center gap-1.5">
          {secret && (
            <button
              type="button"
              onClick={() => setShown(!shown)}
              className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              {shown ? 'Hide' : 'Show'}
            </button>
          )}
          <CopyButton text={value} />
        </div>
      </div>
      <code className="mt-1 block break-all font-mono text-[13px] text-[var(--color-text)]">
        {shown ? value : `${value.slice(0, 6)}${'•'.repeat(Math.max(8, value.length - 6))}`}
      </code>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function KeysPage() {
  const [keyData, setKeyData] = useState<KeyData | null>(null);
  const [proxyUsername, setProxyUsername] = useState('');
  const [countries, setCountries] = useState<CountryInventory[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState('');
  const [confirmRotate, setConfirmRotate] = useState(false);

  // Builder state
  const [network, setNetwork] = useState<Network>('mobile');
  const [country, setCountry] = useState('us');
  const [countrySearch, setCountrySearch] = useState('');
  const [rotation, setRotation] = useState<RotationMode>('sticky');
  const [protocol, setProtocol] = useState<Protocol>('http');
  const [quantity, setQuantity] = useState(1);
  const [prefix, setPrefix] = useState('');
  const [format, setFormat] = useState<OutputFormat>('url');
  const [seed, setSeed] = useState(0);
  const [snippet, setSnippet] = useState('curl');

  // Live sessions
  const [sessions, setSessions] = useState<LiveSession[] | null>(null);
  const [sessionsError, setSessionsError] = useState('');

  const loadKey = useCallback(async () => {
    try {
      const res = await fetch('/api/pool/keys');
      const data = await res.json();
      setKeyData(data.key ?? null);
      if (data.proxyUsername) setProxyUsername(data.proxyUsername);
      setError(data.error ?? '');
    } catch {
      setError('Could not load your key — check your connection and refresh.');
    }
    setLoading(false);
  }, []);

  const loadInventory = useCallback(async () => {
    try {
      const res = await fetch('/api/pool/stock');
      if (!res.ok) return;
      const data = (await res.json()) as { countries?: CountryInventory[] };
      if (Array.isArray(data.countries)) setCountries(data.countries);
    } catch {
      // Non-critical: the builder falls back to known-good countries.
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/pool/sessions');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not load sessions');
      setSessions(data.sessions ?? []);
      setSessionsError('');
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : 'Could not load sessions');
    }
  }, []);

  useEffect(() => {
    loadKey();
    loadInventory();
  }, [loadKey, loadInventory]);

  const hasKey = keyData !== null;
  useEffect(() => {
    if (!hasKey) return;
    loadSessions();
    const id = setInterval(loadSessions, 30_000);
    return () => clearInterval(id);
  }, [hasKey, loadSessions]);

  // Countries offered for the selected network, most stock first.
  const offered = useMemo(() => {
    if (!countries) {
      return (network === 'modem' ? FALLBACK_MODEM : FALLBACK_MOBILE).map((code) => ({
        code,
        count: null as number | null,
        carriers: [] as string[],
      }));
    }
    return countries
      .map((c) => ({
        code: c.code,
        count: stockFor(network, c) as number | null,
        carriers: c.carriers,
      }))
      .filter((c) => (c.count ?? 0) > 0)
      .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  }, [countries, network]);

  // Keep the selected country valid when the network or stock changes.
  useEffect(() => {
    if (offered.length && !offered.some((c) => c.code === country)) {
      setCountry(offered.some((c) => c.code === 'us') ? 'us' : offered[0].code);
    }
  }, [offered, country]);

  const visibleCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return offered;
    return offered.filter((c) => c.code.includes(q) || countryName(c.code).toLowerCase().includes(q));
  }, [offered, countrySearch]);

  const rotationMeta = rotationOption(rotation);
  const effectiveQuantity = rotationMeta.needsSession ? quantity : 1;

  const credentials: ProxyCredentials[] = useMemo(() => {
    if (!keyData || !proxyUsername) return [];
    return Array.from({ length: effectiveQuantity }, () =>
      buildCredentials({
        proxyUsername,
        pakKey: keyData.key,
        network,
        country,
        rotation,
        protocol,
        sid: newSessionId(prefix || 's'),
      }),
    );
    // `seed` is a dependency on purpose: bumping it issues fresh session ids.
  }, [keyData, proxyUsername, network, country, rotation, protocol, effectiveQuantity, prefix, seed]); // eslint-disable-line react-hooks/exhaustive-deps

  const lines = credentials.map((c) => formatCredentials(c, format));
  const first = credentials[0];
  const snippets = first ? codeSnippets(first) : [];
  const activeSnippet = snippets.find((s) => s.id === snippet) ?? snippets[0];

  async function keyAction(action: 'toggle_enabled' | 'regenerate') {
    setBusy(action);
    setNotice(null);
    try {
      const res = await fetch('/api/pool/keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Action failed');
      setKeyData(data.key);
      if (action === 'regenerate') {
        setSeed((s) => s + 1);
        setNotice({ type: 'success', text: 'New password issued and old connections closed. Update the password in your tools — the old one stops working within ~30 seconds.' });
      } else {
        setNotice({ type: 'success', text: data.key.enabled ? 'Key resumed — your proxies work again.' : 'Key paused — all connections were closed.' });
      }
      loadSessions();
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Action failed' });
    }
    setConfirmRotate(false);
    setBusy('');
  }

  async function closeSessions(sessionKey?: string) {
    setBusy(sessionKey ?? 'close_all');
    try {
      const res = await fetch('/api/pool/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionKey ? { sessionKey } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not close sessions');
      await loadSessions();
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : 'Could not close sessions');
    }
    setBusy('');
  }

  // ── Loading / empty states ──

  if (loading) {
    return (
      <div className="space-y-4" aria-busy>
        <div className="h-8 w-56 rounded-lg bg-[var(--color-surface)] animate-pulse" />
        <div className="h-32 rounded-2xl bg-[var(--color-surface)] animate-pulse" />
        <div className="h-96 rounded-2xl bg-[var(--color-surface)] animate-pulse" />
      </div>
    );
  }

  if (!keyData) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Proxy Keys</h1>
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>
        )}
        <Card className="p-8 sm:p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-2xl" aria-hidden>🔑</div>
          <h2 className="mt-4 text-lg font-semibold text-[var(--color-text)]">You don&apos;t have a proxy key yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-text-muted)]">
            Buy traffic and your key is created instantly. Then pick a country here and copy your proxy — it works in any
            HTTP or SOCKS5 client.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard/purchase"
              className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Buy traffic
            </Link>
            <Link
              href="/dashboard/billing"
              className="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-hover)]"
            >
              Have a promo code?
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // ── Key status ──

  const usedGB = keyData.trafficUsedMB != null ? keyData.trafficUsedMB / 1024 : keyData.trafficUsedGB ?? 0;
  const capGB = keyData.trafficCapGB;
  const remainingGB = capGB != null ? Math.max(0, capGB - usedGB) : null;
  const usagePct = capGB ? Math.min(100, (usedGB / capGB) * 100) : 0;
  const status = keyStatus(keyData, usedGB);
  const usable = status === 'active';
  const daysLeft = keyData.expiresAt ? Math.ceil((new Date(keyData.expiresAt).getTime() - Date.now()) / 86_400_000) : null;
  const lowTraffic = status === 'active' && capGB != null && usagePct >= 85;
  const expiringSoon = status === 'active' && daysLeft != null && daysLeft <= 3;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Proxy Keys</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Pick a network and country, copy your proxy, and go. Every setting lives in the username — no extra setup.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { loadKey(); loadInventory(); loadSessions(); }}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-medium text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}
      {notice && (
        <div
          role="status"
          className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
            notice.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
          }`}
        >
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} className="opacity-60 hover:opacity-100" aria-label="Dismiss">×</button>
        </div>
      )}

      {/* Out-of-service / warning banners */}
      {(status === 'exhausted' || status === 'expired') && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              {status === 'expired' ? 'Your traffic has expired' : 'You have used all your traffic'}
            </p>
            <p className="mt-0.5 text-xs text-red-600/80 dark:text-red-400/80">
              Your proxies are stopped. Buy more traffic and the same key and proxy strings start working again right away.
            </p>
          </div>
          <Link href="/dashboard/purchase" className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Buy more traffic
          </Link>
        </div>
      )}
      {(lowTraffic || expiringSoon) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {lowTraffic
              ? `Running low — ${remainingGB?.toFixed(2)} GB left.`
              : `Your traffic expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`}{' '}
            Top up to keep your proxies running without interruption.
          </p>
          <Link href="/dashboard/purchase" className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Top up
          </Link>
        </div>
      )}

      {/* Key status + connection details */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_META[status].className}`}>
              {STATUS_META[status].label}
            </span>
            {keyData.lastUsedAt && (
              <span className="text-[11px] text-[var(--color-text-muted)]">Last used {timeAgo(new Date(keyData.lastUsedAt).getTime())}</span>
            )}
          </div>

          <div className="mt-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-3xl font-bold tabular-nums text-[var(--color-text)]">
                {remainingGB != null ? remainingGB.toFixed(2) : '∞'}
                <span className="ml-1 text-sm font-medium text-[var(--color-text-muted)]">GB left</span>
              </span>
              {capGB != null && (
                <span className="text-xs tabular-nums text-[var(--color-text-muted)]">{usedGB.toFixed(2)} / {capGB} GB used</span>
              )}
            </div>
            {capGB != null && (
              <div
                className="mt-2.5 h-2 overflow-hidden rounded-full bg-[var(--color-bg)]"
                role="progressbar"
                aria-label="Traffic used"
                aria-valuenow={Math.round(usagePct)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`h-full rounded-full transition-all ${usagePct > 90 ? 'bg-red-500' : usagePct > 70 ? 'bg-amber-500' : 'bg-[var(--color-primary)]'}`}
                  style={{ width: `${usagePct}%` }}
                />
              </div>
            )}
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              {keyData.expiresAt
                ? `Valid until ${new Date(keyData.expiresAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}${daysLeft != null && daysLeft > 0 ? ` · ${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : ''} · top-ups add traffic and extend it`
                : 'No expiry'}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/dashboard/purchase"
              className="rounded-xl bg-[var(--color-primary)] px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-90"
            >
              Add traffic
            </Link>
            {(status === 'active' || status === 'paused') && (
              <button
                type="button"
                onClick={() => keyAction('toggle_enabled')}
                disabled={!!busy}
                className="rounded-xl border border-[var(--color-border)] px-3.5 py-2 text-xs font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-hover)] disabled:opacity-40"
              >
                {busy === 'toggle_enabled' ? 'Working…' : keyData.enabled ? 'Pause key' : 'Resume key'}
              </button>
            )}
            {!confirmRotate ? (
              <button
                type="button"
                onClick={() => setConfirmRotate(true)}
                disabled={!!busy}
                className="rounded-xl border border-[var(--color-border)] px-3.5 py-2 text-xs font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-hover)] disabled:opacity-40"
              >
                New password
              </button>
            ) : (
              <div className="flex w-full flex-wrap items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5">
                <span className="flex-1 text-xs text-amber-700 dark:text-amber-400">
                  Issues a new password and disconnects everything using the old one. Only do this if it leaked.
                </span>
                <button
                  type="button"
                  onClick={() => keyAction('regenerate')}
                  disabled={!!busy}
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                >
                  {busy === 'regenerate' ? 'Working…' : 'Confirm'}
                </button>
                <button type="button" onClick={() => setConfirmRotate(false)} className="text-xs text-[var(--color-text-muted)]">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-3">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Connection details</h2>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            One gateway for everything. Country, network and rotation are chosen by the username — build it below.
          </p>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            <Field label="Host" value={GATEWAY_HOST} />
            <Field label="Ports" value={`${HTTP_PORT} (HTTP) · ${SOCKS5_PORT} (SOCKS5)`} />
            <div className="sm:col-span-2">
              <Field label="Password (your key)" value={keyData.key} secret />
            </div>
          </div>
        </Card>
      </div>

      {/* Builder */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="p-5 xl:col-span-2 space-y-6">
          <div>
            <StepLabel n={1}>Network</StepLabel>
            <Segmented<Network>
              value={network}
              onChange={setNetwork}
              options={NETWORKS}
            />
            {network === 'modem' && (
              <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
                Our own carrier modems — the steadiest connections, in fewer countries. “Mobile” also includes them.
              </p>
            )}
          </div>

          <div>
            <StepLabel n={2}>Country</StepLabel>
            <input
              type="search"
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              placeholder={`Search ${offered.length} countries…`}
              aria-label="Search countries"
              className="mb-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/60 focus:border-[var(--color-primary)] focus:outline-none"
            />
            <div className="max-h-64 overflow-y-auto rounded-xl border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
              {visibleCountries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCountry(c.code)}
                  aria-pressed={country === c.code}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left transition ${
                    country === c.code ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                  }`}
                >
                  <span className="text-lg leading-none" aria-hidden>{flag(c.code)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{countryName(c.code)}</span>
                    {network === 'mobile' && c.carriers.length > 0 && (
                      <span className="block truncate text-[11px] text-[var(--color-text-muted)]">{c.carriers.slice(0, 3).join(' · ')}</span>
                    )}
                  </span>
                  {c.count != null && (
                    <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {c.count} online
                    </span>
                  )}
                </button>
              ))}
              {visibleCountries.length === 0 && (
                <p className="px-3 py-6 text-center text-xs text-[var(--color-text-muted)]">No country matches “{countrySearch}”.</p>
              )}
            </div>
          </div>

          <div>
            <StepLabel n={3}>IP rotation</StepLabel>
            <div className="grid gap-1.5">
              {ROTATIONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition ${
                    rotation === r.value ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="rotation"
                    value={r.value}
                    checked={rotation === r.value}
                    onChange={() => setRotation(r.value)}
                    className="mt-0.5 accent-[var(--color-primary)]"
                  />
                  <span>
                    <span className="block text-sm font-medium text-[var(--color-text)]">{r.label}</span>
                    <span className="block text-[11px] text-[var(--color-text-muted)]">{r.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <StepLabel n={4}>Protocol</StepLabel>
            <Segmented<Protocol>
              value={protocol}
              onChange={setProtocol}
              options={[
                { value: 'http', label: 'HTTP(S)', hint: `Port ${HTTP_PORT}` },
                { value: 'socks5', label: 'SOCKS5', hint: `Port ${SOCKS5_PORT}` },
              ]}
            />
          </div>
        </Card>

        <div className="min-w-0 space-y-4 xl:col-span-3">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text)]">
                  {flag(country)} {countryName(country)} · {NETWORKS.find((n) => n.value === network)?.label} · {rotationMeta.label}
                </h2>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  {usable
                    ? 'Ready to use — copy and paste into your tool.'
                    : 'Your key is not active, so these proxies will not connect until you top up or resume it.'}
                </p>
              </div>
              {rotationMeta.needsSession && (
                <button
                  type="button"
                  onClick={() => setSeed((s) => s + 1)}
                  className="rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-xs font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-hover)]"
                  title="Start new sessions on different devices"
                >
                  ↻ New session{effectiveQuantity > 1 ? 's' : ''}
                </button>
              )}
            </div>

            {first ? (
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                <Field label="Host" value={first.host} />
                <Field label="Port" value={String(first.port)} />
                <div className="sm:col-span-2"><Field label="Username" value={first.username} /></div>
                <div className="sm:col-span-2"><Field label="Password" value={first.password} secret /></div>
                <div className="sm:col-span-2">
                  <Field label={`Full proxy (${OUTPUT_FORMATS.find((f) => f.value === format)?.label})`} value={formatCredentials(first, format)} />
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--color-text-muted)]">Proxy details are unavailable — refresh the page or contact support.</p>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="qty" className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Quantity</label>
                <input
                  id="qty"
                  type="number"
                  min={1}
                  max={500}
                  value={quantity}
                  disabled={!rotationMeta.needsSession}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
                  className="w-24 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="prefix" className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Session prefix</label>
                <input
                  id="prefix"
                  type="text"
                  value={prefix}
                  disabled={!rotationMeta.needsSession}
                  onChange={(e) => setPrefix(sanitizeSessionPrefix(e.target.value))}
                  placeholder="e.g. shop1"
                  className="w-40 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 font-mono text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none disabled:opacity-50"
                />
              </div>
              <div className="min-w-[12rem] flex-1">
                <label htmlFor="format" className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Format</label>
                <select
                  id="format"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as OutputFormat)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                >
                  {OUTPUT_FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
              {rotationMeta.needsSession
                ? 'Each line is its own session on its own device — run them in parallel.'
                : 'In this mode every connection already gets a fresh device, so one line is all you need.'}
            </p>

            <div className="mt-3 max-h-60 overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
              <pre className="whitespace-pre font-mono text-[12px] leading-relaxed text-[var(--color-text)]">{lines.join('\n')}</pre>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <CopyButton text={lines.join('\n')} label={lines.length > 1 ? `Copy all ${lines.length}` : 'Copy'} className="px-3.5 py-2" />
              <button
                type="button"
                onClick={() => downloadText(`proxies-${country}-${network}-${rotation}.txt`, lines.join('\n'))}
                disabled={lines.length === 0}
                className="rounded-lg border border-[var(--color-border)] px-3.5 py-2 text-xs font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-hover)] disabled:opacity-40"
              >
                Download .txt
              </button>
            </div>
          </Card>

          {activeSnippet && (
            <Card className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-[var(--color-text)]">Test it in 10 seconds</h2>
                <div className="flex gap-1 rounded-lg bg-[var(--color-bg)] p-1">
                  {snippets.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSnippet(s.id)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                        activeSnippet.id === s.id ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm' : 'text-[var(--color-text-muted)]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3 overflow-x-auto rounded-xl bg-[#0c0c14] p-4">
                <pre className="font-mono text-[12px] leading-relaxed text-gray-100">{activeSnippet.code}</pre>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[11px] text-[var(--color-text-muted)]">Prints the IP your traffic exits from.</p>
                <CopyButton text={activeSnippet.code} />
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Live sessions — only rendered when the upstream reports some. As of
          Sep 2026 /gateway/pool/my-sessions returns nothing for pak_ traffic
          even account-wide, so an always-visible panel would sit empty after
          promising "it will show up here". */}
      {sessions && sessions.length > 0 && (
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Live sessions
              {sessions && sessions.length > 0 && (
                <span className="ml-2 rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[11px] text-[var(--color-primary)]">{sessions.length}</span>
              )}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">Sessions currently open with your key. Updates every 30 seconds.</p>
          </div>
          {sessions && sessions.length > 0 && (
            <button
              type="button"
              onClick={() => closeSessions()}
              disabled={!!busy}
              className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-500/10 disabled:opacity-40 dark:text-red-400"
            >
              {busy === 'close_all' ? 'Closing…' : 'Close all'}
            </button>
          )}
        </div>

        {sessionsError && <p className="mt-3 text-xs text-red-600 dark:text-red-400">{sessionsError}</p>}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
                  <th className="pb-2 font-semibold">Session</th>
                  <th className="pb-2 font-semibold">Location</th>
                  <th className="pb-2 font-semibold">Rotation</th>
                  <th className="pb-2 text-right font-semibold">Requests</th>
                  <th className="pb-2 text-right font-semibold">Traffic</th>
                  <th className="pb-2 text-right font-semibold">Last active</th>
                  <th className="pb-2"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {sessions.map((s) => (
                  <tr key={s.sessionKey} className="text-[var(--color-text)]">
                    <td className="py-2.5 font-mono text-xs">{s.sessionId}</td>
                    <td className="py-2.5 text-xs">
                      {flag(s.country)} {s.country.toUpperCase()}
                      {s.carrier && <span className="text-[var(--color-text-muted)]"> · {s.carrier}</span>}
                    </td>
                    <td className="py-2.5 text-xs">{ROTATIONS.find((r) => r.value === s.rotation)?.label ?? s.rotation}</td>
                    <td className="py-2.5 text-right text-xs tabular-nums">{s.requestCount.toLocaleString()}</td>
                    <td className="py-2.5 text-right text-xs tabular-nums">{formatBytes(s.bytesIn + s.bytesOut)}</td>
                    <td className="py-2.5 text-right text-xs text-[var(--color-text-muted)]">{timeAgo(s.lastActivityAt)}</td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => closeSessions(s.sessionKey)}
                        disabled={!!busy}
                        className="text-xs text-[var(--color-text-muted)] hover:text-red-500 disabled:opacity-40"
                      >
                        {busy === s.sessionKey ? '…' : 'Close'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </Card>
      )}

      {/* Good to know */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">Good to know</h2>
        <ul className="mt-3 grid gap-3 text-xs leading-relaxed text-[var(--color-text-muted)] md:grid-cols-2">
          <li>
            <strong className="text-[var(--color-text)]">Sticky keeps the device, not always the IP.</strong> Mobile carriers
            re-assign IPs on their own schedule, so a sticky session can occasionally show a new address on the same phone. For the
            steadiest single IP, use Residential + Sticky.
          </li>
          <li>
            <strong className="text-[var(--color-text)]">Idle sessions end after 1 hour.</strong> Keep using the same line and it
            stays on its device; after a long pause it picks a new one. Click “New session” anytime for fresh devices.
          </li>
          <li>
            <strong className="text-[var(--color-text)]">Only traffic is billed.</strong> Open as many sessions and parallel
            connections as you need — you pay per GB, nothing else.
          </li>
          <li>
            <strong className="text-[var(--color-text)]">Keep your password private.</strong> Anyone with it can use your traffic.
            If it leaks, click “New password” — the old one stops working within about 30 seconds.
          </li>
        </ul>
      </Card>
    </div>
  );
}
