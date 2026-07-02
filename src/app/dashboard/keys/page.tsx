'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

interface KeyData {
  id: string;
  key: string;
  label: string;
  trafficCapGB: number | null;
  trafficUsedGB: number;
  trafficUsedMB: number;
  enabled: boolean;
  expiresAt: string | null;
  isExpired: boolean;
  lastUsedAt: string | null;
  createdAt: number;
}

interface PoolStock {
  pools: { mbl: Record<string, number>; peer: Record<string, number> };
  totals: { mbl: number; peer: number; all: number };
  generatedAt: string;
}

interface TrackedSession {
  sid: string;
  country: string;
  pool: 'mbl' | 'peer';
  rotation: string;
  protocol: 'http' | 'socks5';
  url: string;
  createdAt: number;
}

const SESSIONS_KEY = 'proxy_sessions';

function loadSessions(): TrackedSession[] {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
  } catch { return []; }
}

function saveSessions(sessions: TrackedSession[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const COUNTRY_META: Record<string, { name: string; flag: string }> = {
  us: { name: 'United States', flag: '\u{1F1FA}\u{1F1F8}' },
  de: { name: 'Germany', flag: '\u{1F1E9}\u{1F1EA}' },
  pl: { name: 'Poland', flag: '\u{1F1F5}\u{1F1F1}' },
  fr: { name: 'France', flag: '\u{1F1EB}\u{1F1F7}' },
  es: { name: 'Spain', flag: '\u{1F1EA}\u{1F1F8}' },
  gb: { name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}' },
  ch: { name: 'Switzerland', flag: '\u{1F1E8}\u{1F1ED}' },
  pa: { name: 'Panama', flag: '\u{1F1F5}\u{1F1E6}' },
  am: { name: 'Armenia', flag: '\u{1F1E6}\u{1F1F2}' },
};

const ROTATION_OPTIONS = [
  { value: 'sticky', label: 'Sticky', desc: 'Holds one device (IP as stable as the carrier allows)' },
  { value: 'auto10', label: 'Auto 10m', desc: 'Fresh IP roughly every 10 minutes' },
  { value: 'auto30', label: 'Auto (long)', desc: 'Fresh IP on a longer interval' },
  { value: 'hard', label: 'Hard', desc: 'Strict device pin (like sticky)' },
  { value: 'none', label: 'None', desc: 'Default gateway behavior' },
] as const;

const USE_CASES = [
  'Multi-account management',
  'Web scraping without bans',
  'Geo-specific content access',
  'Social media automation',
];

const INCLUDED_FEATURES = [
  'Real 4G/5G mobile devices',
  'Carrier-assigned IPs',
  'Unlimited parallel sessions',
  'On-demand IP rotation',
  'HTTP & SOCKS5 protocols',
];

function randomHex(len: number) {
  const chars = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * 16)];
  return s;
}

function buildProxyUrlLocal(
  username: string,
  pakKey: string,
  opts: {
    country: string;
    pool: 'mbl' | 'peer';
    rotation: string;
    sid?: string;
    protocol: 'http' | 'socks5';
  },
) {
  const tokens = [opts.pool, opts.country];
  if (opts.sid) tokens.push('sid', opts.sid);
  if (opts.rotation && opts.rotation !== 'none') tokens.push('rot', opts.rotation);
  const user = `${username}-${tokens.join('-')}`;
  const port = opts.protocol === 'socks5' ? 7001 : 7000;
  return `${opts.protocol}://${encodeURIComponent(user)}:${encodeURIComponent(pakKey)}@gw.proxies.sx:${port}`;
}

export default function KeysPage() {
  const [keyData, setKeyData] = useState<KeyData | null>(null);
  const [proxyUsername, setProxyUsername] = useState('');
  const [stock, setStock] = useState<PoolStock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Generator state
  const [country, setCountry] = useState('us');
  const [protocol, setProtocol] = useState<'http' | 'socks5'>('http');
  const [pool, setPool] = useState<'mbl' | 'peer'>('mbl');
  const [rotation, setRotation] = useState('sticky');
  const [sessionPrefix, setSessionPrefix] = useState('s');
  const [sessionCount, setSessionCount] = useState(1);
  const [generatedUrls, setGeneratedUrls] = useState<string[]>([]);
  const [showReference, setShowReference] = useState(false);
  const [sessions, setSessions] = useState<TrackedSession[]>([]);
  const [countrySearch, setCountrySearch] = useState('');

  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  const loadKey = useCallback(async () => {
    try {
      const res = await fetch('/api/pool/keys');
      const data = await res.json();
      if (!res.ok && res.status !== 502) throw new Error(data.error ?? `HTTP ${res.status}`);
      setKeyData(data.key ?? null);
      if (data.proxyUsername) setProxyUsername(data.proxyUsername);
      if (data.error) setError(data.error);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load key');
    }
    setLoading(false);
  }, []);

  const loadStock = useCallback(async () => {
    try {
      const res = await fetch('/api/pool/stock');
      if (res.ok) {
        const data = await res.json();
        setStock(data);
      }
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    loadKey();
    loadStock();
  }, [loadKey, loadStock]);

  const countries = useMemo(() => {
    const baseList = Object.keys(COUNTRY_META);
    const stockCodes = stock
      ? new Set([...Object.keys(stock.pools.mbl), ...Object.keys(stock.pools.peer)])
      : new Set();
    const allCodes = Array.from(new Set([...baseList, ...Array.from(stockCodes) as string[]]));

    return allCodes
      .map((code) => ({
        code,
        mbl: stock?.pools.mbl[code] ?? 0,
        peer: stock?.pools.peer[code] ?? 0,
        total: (stock?.pools.mbl[code] ?? 0) + (stock?.pools.peer[code] ?? 0),
        ...COUNTRY_META[code] ?? { name: code.toUpperCase(), flag: '' },
      }))
      .filter((c) => {
        if (!countrySearch) return true;
        const q = countrySearch.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
      })
      .sort((a, b) => b.total - a.total);
  }, [stock, countrySearch]);

  const selectedCountryMeta = COUNTRY_META[country] ?? { name: country.toUpperCase(), flag: '' };

  function generateUrls() {
    if (!keyData || !proxyUsername) return;
    const urls: string[] = [];
    const newSessions: TrackedSession[] = [];
    for (let i = 0; i < sessionCount; i++) {
      const sid = sessionCount === 1 && !sessionPrefix
        ? undefined
        : `${sessionPrefix}${randomHex(8)}`;
      const url = buildProxyUrlLocal(proxyUsername, keyData.key, {
        country, pool, rotation, sid, protocol,
      });
      urls.push(url);
      if (sid) {
        newSessions.push({ sid, country, pool, rotation, protocol, url, createdAt: Date.now() });
      }
    }
    setGeneratedUrls(urls);
    if (newSessions.length > 0) {
      const updated = [...newSessions, ...sessions].slice(0, 200);
      setSessions(updated);
      saveSessions(updated);
    }
  }

  async function handleAction(action: string) {
    setActionLoading(action);
    setMessage(null);
    try {
      const res = await fetch('/api/pool/keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Action failed');

      if (action === 'delete') {
        setKeyData(null);
        setGeneratedUrls([]);
        setMessage({ type: 'success', text: 'Key deleted. Purchase a new plan to get a fresh key.' });
      } else {
        setKeyData(data.key);
        if (action === 'toggle_enabled') {
          setMessage({ type: 'success', text: data.key.enabled ? 'Key enabled' : 'Key suspended' });
        } else if (action === 'regenerate') {
          setGeneratedUrls([]);
          setMessage({ type: 'success', text: 'Key secret rotated. Re-generate your proxy URLs.' });
        }
      }
      setConfirmDelete(false);
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Action failed' });
    }
    setActionLoading('');
  }

  if (loading) {
    return <p className="text-[var(--color-text-muted)]">Loading...</p>;
  }

  if (!keyData) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-4">Proxy Keys</h1>
        {message && (
          <div className={`rounded-lg border p-3 mb-4 text-sm ${
            message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-600'
          }`}>{message.text}</div>
        )}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <p className="text-[var(--color-text-muted)] mb-4">
            No proxy key yet. Purchase a plan to get started.
          </p>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          <a
            href="/dashboard/purchase"
            className="inline-block mt-4 rounded-lg bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Purchase a plan
          </a>
        </div>
      </div>
    );
  }

  const usedGB = keyData.trafficUsedMB != null
    ? keyData.trafficUsedMB / 1024
    : (keyData.trafficUsedGB ?? 0);
  const capGB = keyData.trafficCapGB ?? 0;
  const usagePercent = capGB > 0 ? Math.min(100, (usedGB / capGB) * 100) : 0;
  const isActive = keyData.enabled && !keyData.isExpired;

  // Live preview URL
  const previewSid = sessionCount > 1 || sessionPrefix ? `${sessionPrefix || 's'}${randomHex(4)}` : undefined;
  const previewUrl = isActive && proxyUsername
    ? buildProxyUrlLocal(proxyUsername, keyData.key, { country, pool, rotation, sid: previewSid, protocol })
    : '';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Configure Your Proxy</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Build connection URLs from your active key. Pick country, pool, and rotation — done.
          </p>
        </div>
        <button
          onClick={() => setShowReference(!showReference)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-bg)] transition"
        >
          <span>{showReference ? '−' : '+'}</span>
          {showReference ? 'Hide' : 'Open'} Connection Guide
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {message && (
        <div className={`rounded-lg border p-3 text-sm ${
          message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-600'
        }`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right text-xs opacity-60 hover:opacity-100">&times;</button>
        </div>
      )}

      {/* Compact Key Status Bar */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: isActive ? '#dcfce7' : '#fee2e2',
                color: isActive ? '#059669' : '#dc2626',
              }}
            >
              {keyData.isExpired ? 'Expired' : keyData.enabled ? 'Active' : 'Suspended'}
            </span>
            <span className="text-xs font-mono text-[var(--color-text-muted)]">{keyData.id}</span>
            {keyData.expiresAt && (
              <span className="text-xs text-[var(--color-text-muted)]">
                Expires {new Date(keyData.expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleAction('toggle_enabled')}
              disabled={!!actionLoading}
              className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition disabled:opacity-40"
            >
              {actionLoading === 'toggle_enabled' ? '...' : keyData.enabled ? 'Suspend' : 'Enable'}
            </button>
            <button
              onClick={() => handleAction('regenerate')}
              disabled={!!actionLoading}
              className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-primary)] hover:bg-[var(--color-surface-hover)] transition disabled:opacity-40"
            >
              {actionLoading === 'regenerate' ? '...' : 'Rotate Secret'}
            </button>
            <button
              onClick={() => { loadKey(); loadStock(); }}
              disabled={!!actionLoading}
              className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition disabled:opacity-40"
            >
              Refresh
            </button>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={!!actionLoading}
                className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 transition disabled:opacity-40"
              >
                Delete
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleAction('delete')}
                  disabled={!!actionLoading}
                  className="rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-90 transition disabled:opacity-40"
                >
                  {actionLoading === 'delete' ? '...' : 'Confirm Delete'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-text-muted)] transition"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
        {capGB > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-[var(--color-text-muted)]">Traffic</span>
              <span className="text-xs font-medium text-[var(--color-text)]">
                {usedGB.toFixed(2)} / {capGB} GB ({usagePercent.toFixed(1)}%)
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--color-bg)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${usagePercent}%`,
                  backgroundColor: usagePercent > 90 ? '#dc2626' : usagePercent > 70 ? '#f59e0b' : 'var(--color-primary)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Three-column Configurator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* COLUMN 1 — SELECT LOCATION */}
        <div className="lg:col-span-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold">
              Select Location
            </p>
            <span className="text-[10px] text-[var(--color-text-muted)]">
              {stock?.totals.all ?? 0} endpoints
            </span>
          </div>

          <input
            type="text"
            value={countrySearch}
            onChange={(e) => setCountrySearch(e.target.value)}
            placeholder="Search countries..."
            className="w-full mb-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-[var(--color-primary)]"
          />

          <div className="grid grid-cols-3 gap-2 max-h-[420px] overflow-y-auto">
            {countries.map((c) => {
              const selected = country === c.code;
              return (
                <button
                  key={c.code}
                  onClick={() => setCountry(c.code)}
                  className={`relative rounded-lg border p-2.5 text-left transition-all ${
                    selected
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-1 ring-[var(--color-primary)]/30'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)] hover:border-[var(--color-primary)]/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-base leading-none">{c.flag}</span>
                    <span className="text-xs font-semibold text-[var(--color-text)] uppercase">{c.code}</span>
                  </div>
                  <p className="text-[10px] text-[var(--color-text)] font-medium truncate">{c.name}</p>
                  {c.total > 0 && (
                    <p className="text-[9px] text-[var(--color-text-muted)] mt-0.5">{c.total} online</p>
                  )}
                </button>
              );
            })}
            {countries.length === 0 && (
              <p className="col-span-3 text-center text-xs text-[var(--color-text-muted)] py-6">
                No countries match
              </p>
            )}
          </div>
        </div>

        {/* COLUMN 2 — CONFIGURATION */}
        <div className="lg:col-span-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-5">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold mb-2.5">
              Pool Type
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { value: 'mbl' as const, label: 'Mobile', desc: '4G/5G' },
                { value: 'peer' as const, label: 'Residential', desc: 'Home ISP' },
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPool(p.value)}
                  className={`rounded-lg border py-2 text-xs font-medium transition ${
                    pool === p.value
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'
                  }`}
                >
                  {p.label}
                  <span className="block text-[9px] opacity-70">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold mb-2.5">
              Protocol
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {(['http', 'socks5'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setProtocol(p)}
                  className={`rounded-lg border py-2 text-xs font-medium transition ${
                    protocol === p
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'
                  }`}
                >
                  {p.toUpperCase()}
                  <span className="block text-[9px] opacity-70">
                    :{p === 'http' ? '7000' : '7001'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold mb-2.5">
              Rotation Mode
            </p>
            <select
              value={rotation}
              onChange={(e) => setRotation(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
            >
              {ROTATION_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold mb-2.5">
              Sessions
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Prefix</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={sessionPrefix}
                    onChange={(e) => setSessionPrefix(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                    placeholder="s"
                    className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-xs font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                  <button
                    onClick={() => setSessionPrefix(randomHex(4))}
                    className="rounded-lg border border-[var(--color-border)] px-2 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition"
                    title="Randomize prefix"
                  >
                    ⟳
                  </button>
                </div>
              </div>
              <div className="w-20">
                <label className="block text-[10px] text-[var(--color-text-muted)] mb-1">Count</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={sessionCount}
                  onChange={(e) => setSessionCount(Math.max(1, Math.min(100, Number(e.target.value))))}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>
          </div>

          <div className="pt-1">
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold mb-2.5">
              Included Features
            </p>
            <ul className="space-y-1.5">
              {INCLUDED_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-[var(--color-text)]">
                  <svg className="h-3.5 w-3.5 mt-0.5 text-[var(--color-accent)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* COLUMN 3 — ORDER SUMMARY (dark card) */}
        <div className="lg:col-span-3 rounded-xl bg-[#0c0c14] border border-white/[0.06] p-5 flex flex-col text-white">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-3">
            Proxy Summary
          </p>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl leading-none">{selectedCountryMeta.flag}</span>
            <span className="text-base font-semibold">{selectedCountryMeta.name}</span>
          </div>
          <p className="text-[11px] text-gray-500">
            {pool === 'mbl' ? 'Mobile' : 'Residential'} · {protocol.toUpperCase()} · {ROTATION_OPTIONS.find((r) => r.value === rotation)?.label}
          </p>

          <div className="mt-4 rounded-lg bg-black/30 border border-white/[0.04] p-3">
            <p className="text-[10px] text-gray-500 mb-1.5">Live URL preview</p>
            <code className="text-[10px] leading-relaxed text-[var(--color-primary)]/90 break-all block font-mono">
              {previewUrl || '—'}
            </code>
          </div>

          <button
            onClick={generateUrls}
            disabled={!isActive || !proxyUsername}
            className="mt-4 w-full rounded-lg bg-[var(--color-surface)] py-3 text-sm font-semibold text-[#0c0c14] hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Generate {sessionCount > 1 ? `${sessionCount} URLs` : 'URL'}
          </button>

          <p className="mt-2 text-[10px] text-center text-gray-500">
            No commitment — change settings anytime
          </p>

          {/* Money-back style badge */}
          <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 flex items-center gap-2">
            <svg className="h-3.5 w-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.6-1.5a9 9 0 11-17.2 0L12 3l8.6 5.5z" />
            </svg>
            <span className="text-[11px] font-medium text-emerald-400">Real device-only IPs</span>
          </div>

          <div className="mt-5 pt-5 border-t border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-3">
              Perfect For
            </p>
            <ul className="space-y-2">
              {USE_CASES.map((u) => (
                <li key={u} className="flex items-start gap-2 text-xs text-gray-300">
                  <svg className="h-3.5 w-3.5 mt-0.5 text-[var(--color-primary)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {u}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Generated URLs */}
      {generatedUrls.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Generated Proxies ({generatedUrls.length})
            </h2>
            <div className="flex gap-2">
              <CopyButton text={generatedUrls.join('\n')} label="Copy All" />
              <button
                onClick={() => setGeneratedUrls([])}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {generatedUrls.map((url, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-2"
              >
                <code className="flex-1 text-xs text-[var(--color-text)] break-all select-all">{url}</code>
                <CopyButton text={url} label="Copy" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Sessions */}
      {sessions.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[var(--color-text)]">Active Sessions</h2>
              <span className="inline-block rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-primary)]">
                {sessions.length}
              </span>
            </div>
            <button
              onClick={() => { setSessions([]); saveSessions([]); }}
              className="text-xs text-[var(--color-text-muted)] hover:text-red-500 transition"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {sessions.map((s) => {
              const meta = COUNTRY_META[s.country] ?? { name: s.country.toUpperCase(), flag: '' };
              return (
                <div
                  key={s.sid}
                  className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5"
                >
                  <span className="text-base leading-none">{meta.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-mono font-medium text-[var(--color-text)] truncate">
                        {s.sid}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-block rounded bg-[var(--color-primary)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-primary)]">
                        {s.pool.toUpperCase()}
                      </span>
                      <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                        {s.country.toUpperCase()}
                      </span>
                      <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                        {s.protocol.toUpperCase()}
                      </span>
                      {s.rotation !== 'none' && (
                        <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                          rot:{s.rotation}
                        </span>
                      )}
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {timeAgo(s.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <CopyButton text={s.url} label="Copy" />
                    <button
                      onClick={() => {
                        const updated = sessions.filter((x) => x.sid !== s.sid);
                        setSessions(updated);
                        saveSessions(updated);
                      }}
                      className="text-xs text-[var(--color-text-muted)] hover:text-red-500 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Connection Reference (collapsible) */}
      {showReference && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4 text-xs text-[var(--color-text)]">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Connection Format Reference</h2>

          <div>
            <p className="font-medium mb-1.5">URL Structure</p>
            <code className="block rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] p-3 text-[var(--color-primary)] break-all">
              {'{protocol}://{username}-{pool}-{country}[-sid-{id}][-rot-{mode}]:{pak_key}@gw.proxies.sx:{port}'}
            </code>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="font-medium mb-1.5">Pools</p>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-[var(--color-border)]">
                  <tr><td className="py-1 font-mono text-[var(--color-primary)]">mbl</td><td className="py-1 text-[var(--color-text-muted)]">Mobile 4G/5G modems</td></tr>
                  <tr><td className="py-1 font-mono text-[var(--color-primary)]">peer</td><td className="py-1 text-[var(--color-text-muted)]">Residential Android peers</td></tr>
                </tbody>
              </table>
            </div>

            <div>
              <p className="font-medium mb-1.5">Ports</p>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-[var(--color-border)]">
                  <tr><td className="py-1 font-mono text-[var(--color-primary)]">7000</td><td className="py-1 text-[var(--color-text-muted)]">HTTP/HTTPS proxy</td></tr>
                  <tr><td className="py-1 font-mono text-[var(--color-primary)]">7001</td><td className="py-1 text-[var(--color-text-muted)]">SOCKS5 proxy</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="font-medium mb-1.5">Rotation Modes (-rot-)</p>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-[var(--color-border)]">
                <tr><td className="py-1 font-mono text-[var(--color-primary)] w-20">sticky</td><td className="py-1 text-[var(--color-text-muted)]">Hold one device for the session. Use with -sid- to keep the same device across reconnects (IP as stable as the carrier allows).</td></tr>
                <tr><td className="py-1 font-mono text-[var(--color-primary)]">auto10</td><td className="py-1 text-[var(--color-text-muted)]">Auto-rotate roughly every 10 minutes. Good for long scrapers.</td></tr>
                <tr><td className="py-1 font-mono text-[var(--color-primary)]">auto30</td><td className="py-1 text-[var(--color-text-muted)]">Auto-rotate on a longer interval.</td></tr>
                <tr><td className="py-1 font-mono text-[var(--color-primary)]">hard</td><td className="py-1 text-[var(--color-text-muted)]">Strict device pin (like sticky).</td></tr>
                <tr><td className="py-1 font-mono text-[var(--color-primary)]">none</td><td className="py-1 text-[var(--color-text-muted)]">Default gateway behavior.</td></tr>
              </tbody>
            </table>
          </div>

          <div>
            <p className="font-medium mb-1.5">Quick Examples</p>
            <div className="space-y-1.5">
              <code className="block rounded bg-[var(--color-bg)] p-2 text-[10px] break-all text-[var(--color-text-muted)]">
                http://user-mbl-us-sid-abc123-rot-sticky:pak_xxx@gw.proxies.sx:7000
                <span className="block text-[var(--color-text-muted)]/60 mt-0.5">Sticky US mobile session &quot;abc123&quot;</span>
              </code>
              <code className="block rounded bg-[var(--color-bg)] p-2 text-[10px] break-all text-[var(--color-text-muted)]">
                socks5://user-peer-de-rot-hard:pak_xxx@gw.proxies.sx:7001
                <span className="block text-[var(--color-text-muted)]/60 mt-0.5">SOCKS5, German community pool, strict device pin</span>
              </code>
              <code className="block rounded bg-[var(--color-bg)] p-2 text-[10px] break-all text-[var(--color-text-muted)]">
                http://user-mbl-pl-rot-auto10:pak_xxx@gw.proxies.sx:7000
                <span className="block text-[var(--color-text-muted)]/60 mt-0.5">Polish mobile, auto-rotate every 10 min</span>
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function copyText(text: string): boolean {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
    return true;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { /* ignore */ }
  document.body.removeChild(ta);
  return ok;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="text-xs text-[var(--color-primary)] hover:underline transition whitespace-nowrap"
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}
