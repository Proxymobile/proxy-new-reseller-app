'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { config } from '@/config';
import { GATEWAY_HOST, GATEWAY_HTTP_PORT, GATEWAY_SOCKS5_PORT } from '@/lib/gateway';
import { countryInfo } from '@/lib/country-list';
import {
  ROTATIONS, formatProxy, maskSecret, proxyParts, randomSid,
  type OutputFormat, type ProxyPool, type ProxyProtocol, type Rotation,
} from '@/lib/proxy-url';
import { Alert, Card, Empty, Meter, PageHeader, StatTile, Status, type Level } from '@/components/panel/ui';
import { ago, gb, int } from '@/components/panel/format';
import { CopyButton } from '@/components/panel/CopyButton';
import { Segmented } from '../_components/QuickConnect';
import { loadPrefs, savePrefs } from '../_components/prefs';

interface KeyData {
  id: string;
  key: string;
  trafficCapGB: number | null;
  trafficUsedGB?: number;
  trafficUsedMB: number;
  enabled: boolean;
  expiresAt: string | null;
  isExpired?: boolean;
  lastUsedAt: string | null;
}

interface Stock { pools: { mbl: Record<string, number>; peer: Record<string, number> }; totals: { mbl: number; peer: number } }

interface SavedSession { sid: string; country: string; pool: ProxyPool; rotation: string; protocol: ProxyProtocol; createdAt: number }

const SESSIONS_KEY = 'proxy_sessions';
function loadSessions(): SavedSession[] {
  try {
    const list = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
    return Array.isArray(list) ? list.filter((s) => s && typeof s.sid === 'string') : [];
  } catch { return []; }
}
function storeSessions(s: SavedSession[]) {
  try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

const FORMATS: { value: OutputFormat; label: string }[] = [
  { value: 'url', label: 'URL' },
  { value: 'hostport', label: 'host:port:user:pass' },
  { value: 'userpass', label: 'user:pass@host:port' },
];

type Snippet = 'curl' | 'python' | 'node' | 'playwright';

export default function ProxySetupPage() {
  const router = useRouter();
  const [key, setKey] = useState<KeyData | null>(null);
  const [username, setUsername] = useState('');
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState<{ level: Level; text: string } | null>(null);
  const [confirm, setConfirm] = useState<'' | 'regenerate' | 'delete'>('');

  const [country, setCountry] = useState('us');
  const [pool, setPool] = useState<ProxyPool>('mbl');
  const [protocol, setProtocol] = useState<ProxyProtocol>('http');
  const [rotation, setRotation] = useState<Rotation>('sticky');
  const [prefsReady, setPrefsReady] = useState(false);
  const [count, setCount] = useState(1);
  const [prefix, setPrefix] = useState('s');
  const [format, setFormat] = useState<OutputFormat>('url');
  const [search, setSearch] = useState('');
  const [sids, setSids] = useState<string[]>([]);
  const [reveal, setReveal] = useState(false);
  const [snippet, setSnippet] = useState<Snippet>('curl');
  const [sessions, setSessions] = useState<SavedSession[]>([]);

  useEffect(() => {
    const p = loadPrefs();
    setPool(p.pool); setCountry(p.country); setProtocol(p.protocol); setRotation(p.rotation);
    setSessions(loadSessions());
    setPrefsReady(true);
  }, []);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const [kr, sr] = await Promise.all([fetch('/api/pool/keys'), fetch('/api/pool/stock')]);
      const kd = await kr.json().catch(() => ({}));
      setKey(kd.key ?? null);
      if (kd.proxyUsername) setUsername(kd.proxyUsername);
      if (kd.error) setLoadError('We could not reach the proxy network to load your key. Please refresh in a minute.');
      if (sr.ok) setStock(await sr.json());
    } catch {
      setLoadError('Could not load your key. Check your connection and refresh.');
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  // Remember the builder settings for next time (also used by the Overview widget).
  useEffect(() => {
    if (prefsReady) savePrefs({ pool, country, protocol, rotation });
  }, [pool, country, protocol, rotation, prefsReady]);

  // New settings invalidate previously generated session lines.
  useEffect(() => { setSids([]); }, [country, pool]);

  const countries = useMemo(() => {
    const codes = new Set<string>([...config.countries, ...Object.keys(stock?.pools.mbl ?? {}), ...Object.keys(stock?.pools.peer ?? {})]);
    return [...codes]
      .map((code) => ({ code, ...countryInfo(code), mbl: stock?.pools.mbl[code] ?? 0, peer: stock?.pools.peer[code] ?? 0 }))
      .filter((c) => !search || `${c.name} ${c.code}`.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (pool === 'mbl' ? b.mbl - a.mbl : b.peer - a.peer) || a.name.localeCompare(b.name));
  }, [stock, search, pool]);

  const usedGb = key ? (key.trafficUsedMB ?? 0) / 1024 : 0;
  const capGb = key?.trafficCapGB ?? null;
  const pct = capGb ? Math.min(100, (usedGb / capGb) * 100) : null;
  const expired = key ? key.isExpired ?? (!!key.expiresAt && Date.parse(key.expiresAt) < Date.now()) : false;
  const outOfData = pct !== null && pct >= 100;
  const usable = !!key && key.enabled && !expired && !outOfData;
  const status: { level: Level; label: string } = !key ? { level: 'neutral', label: 'No key' }
    : expired ? { level: 'critical', label: 'Expired' }
    : outOfData ? { level: 'critical', label: 'Out of data' }
    : !key.enabled ? { level: 'serious', label: 'Paused' }
    : { level: 'good', label: 'Active' };
  const online = pool === 'mbl' ? stock?.pools.mbl[country] ?? 0 : stock?.pools.peer[country] ?? 0;

  const opts = { country, pool, rotation, protocol };
  const lines = key && username
    ? (sids.length ? sids : [undefined]).map((sid) => formatProxy(username, key.key, { ...opts, sid }, format))
    : [];

  function generate() {
    const n = Math.max(1, Math.min(500, count));
    const next = n === 1 && !prefix ? [] : Array.from({ length: n }, () => randomSid(prefix || 's'));
    setSids(next);
    if (next.length) {
      const saved = [...next.map((sid) => ({ sid, country, pool, rotation, protocol, createdAt: Date.now() })), ...sessions].slice(0, 200);
      setSessions(saved);
      storeSessions(saved);
    }
  }

  function download() {
    const blob = new Blob([lines.join('\n') + '\n'], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `proxies-${country}-${pool}-${lines.length}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function act(action: 'toggle_enabled' | 'regenerate' | 'delete') {
    setBusy(action);
    setNotice(null);
    try {
      const res = await fetch('/api/pool/keys', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      const data = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
      if (!res.ok) throw new Error(data.error ?? 'Action failed');
      if (action === 'delete') {
        setKey(null); setSids([]);
        setNotice({ level: 'good', text: 'Key deleted. Buy bandwidth to get a new one.' });
      } else {
        setKey(data.key);
        if (action === 'regenerate') {
          setSids([]);
          setNotice({ level: 'good', text: 'New key issued. Old proxy URLs stopped working — copy the new ones below.' });
        } else {
          setNotice({ level: 'good', text: data.key.enabled ? 'Key resumed. Connections are accepted again.' : 'Key paused. New connections are refused until you resume it.' });
        }
      }
      router.refresh();
    } catch (e) {
      setNotice({ level: 'critical', text: e instanceof Error ? e.message : 'Action failed' });
    }
    setConfirm('');
    setBusy('');
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Proxy setup" subtitle="Loading your key…" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--color-surface)]" />)}
        </div>
        <div className="mt-4 h-80 animate-pulse rounded-2xl bg-[var(--color-surface)]" />
      </div>
    );
  }

  if (!key) {
    return (
      <div>
        <PageHeader title="Proxy setup" subtitle="Build connection strings for your tools." />
        {notice && <div className="mb-4"><Alert level={notice.level} title={notice.text} /></div>}
        {loadError && <div className="mb-4"><Alert level="serious" title={loadError} /></div>}
        {!loadError && (
          <Card>
            <div className="py-10 text-center">
              <p className="text-base font-semibold text-[var(--color-text)]">You don&apos;t have a proxy key yet</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-[var(--color-text-muted)]">Your key is created the moment you buy bandwidth. One key works for every country and both pools.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Link href="/dashboard/purchase" className="rounded-lg bg-[var(--color-text)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)]">Buy bandwidth</Link>
                <Link href="/dashboard/billing#promo" className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text)]">Redeem a promo code</Link>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }

  const first = proxyParts(username, key.key, { ...opts, sid: sids[0] });
  const firstUrl = formatProxy(username, key.key, { ...opts, sid: sids[0] }, 'url');
  const snippets: Record<Snippet, string> = {
    curl: `curl -x "${firstUrl}" https://api.ipify.org?format=json`,
    python: `import requests\n\nproxy = "${firstUrl}"\nr = requests.get(\n    "https://api.ipify.org?format=json",\n    proxies={"http": proxy, "https": proxy},\n    timeout=30,\n)\nprint(r.json())`,
    node: `import { HttpsProxyAgent } from 'https-proxy-agent';\n\nconst agent = new HttpsProxyAgent('${firstUrl}');\nconst res = await fetch('https://api.ipify.org?format=json', { agent });\nconsole.log(await res.json());`,
    playwright: `import { chromium } from 'playwright';\n\nconst browser = await chromium.launch({\n  proxy: {\n    server: '${first.scheme}://${first.host}:${first.port}',\n    username: '${first.user}',\n    password: '${first.pass}',\n  },\n});`,
  };

  return (
    <div>
      <PageHeader title="Proxy setup" subtitle="Pick a location and settings, then copy the connection strings into your tool." />

      {notice && <div className="mb-4"><Alert level={notice.level} title={notice.text} /></div>}
      {loadError && <div className="mb-4"><Alert level="serious" title={loadError} /></div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Status" value={<Status level={status.level}>{status.label}</Status>} hint={`Last request ${ago(key.lastUsedAt)}`} />
        <StatTile
          label="Data left"
          value={capGb === null ? 'Unlimited' : gb(Math.max(0, capGb - usedGb))}
          delta={capGb ? <div className="mt-1.5"><Meter value={usedGb} max={capGb} /></div> : undefined}
          hint={capGb ? `${gb(usedGb)} of ${gb(capGb)} used` : undefined}
          href="/dashboard/purchase"
        />
        <StatTile
          label="Expires"
          value={key.expiresAt ? new Date(key.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}
          hint={key.expiresAt ? (expired ? 'expired — top up to reactivate' : `in ${Math.ceil((Date.parse(key.expiresAt) - Date.now()) / 86_400_000)} days`) : undefined}
        />
        <div className="viz min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs text-[var(--color-text-muted)]">Key controls</p>
          {confirm ? (
            <div className="mt-2">
              <p className="text-xs text-[var(--color-text)]">
                {confirm === 'regenerate' ? 'Issue a new secret? Every existing proxy URL stops working.' : 'Delete this key? Any remaining data is lost.'}
              </p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => act(confirm)} disabled={!!busy} className="rounded-lg bg-[var(--viz-critical)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                  {busy ? 'Working…' : confirm === 'regenerate' ? 'Yes, rotate' : 'Yes, delete'}
                </button>
                <button onClick={() => setConfirm('')} className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text)]">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button onClick={() => act('toggle_enabled')} disabled={!!busy || expired} className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40">
                {busy === 'toggle_enabled' ? '…' : key.enabled ? 'Pause' : 'Resume'}
              </button>
              <button onClick={() => setConfirm('regenerate')} disabled={!!busy} className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40">Rotate secret</button>
              <button onClick={() => { setLoading(true); load(); }} disabled={!!busy} className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40">Refresh</button>
              <button onClick={() => setConfirm('delete')} disabled={!!busy} className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--viz-bad-text)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40">Delete</button>
            </div>
          )}
        </div>
      </div>

      {!usable && (
        <div className="mt-4">
          <Alert level="serious" title={expired || outOfData ? 'This key cannot connect right now' : 'This key is paused'} href={expired || outOfData ? '/dashboard/purchase' : undefined}>
            {expired || outOfData ? 'Buy bandwidth to reactivate it — your URLs stay the same.' : 'Resume it above to accept connections again.'}
          </Alert>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Card title="1 · Location" subtitle={stock ? `${int(pool === 'mbl' ? stock.totals.mbl : stock.totals.peer)} ${pool === 'mbl' ? 'mobile' : 'residential'} devices online` : 'Live stock unavailable'} className="lg:col-span-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search countries"
            aria-label="Search countries"
            className="mb-3 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
          />
          <ul role="radiogroup" aria-label="Country" className="max-h-[380px] space-y-1 overflow-y-auto pr-1">
            {countries.map((c) => {
              const n = pool === 'mbl' ? c.mbl : c.peer;
              const on = c.code === country;
              return (
                <li key={c.code}>
                  <button
                    role="radio"
                    aria-checked={on}
                    onClick={() => setCountry(c.code)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition ${
                      on ? 'border-[var(--color-primary)]/50 bg-[var(--color-primary)]/8' : 'border-transparent hover:bg-[var(--color-surface-hover)]'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm text-[var(--color-text)]">
                      <span aria-hidden>{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                      <span className="font-mono text-[10px] text-[var(--color-text-muted)]">{c.code}</span>
                    </span>
                    {stock && (n > 0
                      ? <span className="shrink-0 text-[11px] tabular-nums text-[var(--color-text-muted)]">{int(n)} online</span>
                      : <span className="shrink-0 text-[11px] text-[var(--viz-bad-text)]">none online</span>)}
                  </button>
                </li>
              );
            })}
            {countries.length === 0 && <Empty>No countries match</Empty>}
          </ul>
        </Card>

        <Card title="2 · Settings" className="lg:col-span-4">
          <div className="space-y-5">
            <Field label="Pool">
              <Segmented value={pool} onChange={setPool} size="md" options={[{ value: 'mbl', label: 'Mobile 4G/5G' }, { value: 'peer', label: 'Residential' }]} />
            </Field>
            <Field label="Protocol">
              <Segmented value={protocol} onChange={setProtocol} size="md" options={[{ value: 'http', label: 'HTTP', hint: `:${GATEWAY_HTTP_PORT}` }, { value: 'socks5', label: 'SOCKS5', hint: `:${GATEWAY_SOCKS5_PORT}` }]} />
            </Field>
            <Field label="IP rotation">
              <div role="radiogroup" aria-label="IP rotation" className="space-y-1.5">
                {ROTATIONS.map((r) => (
                  <label key={r.value} className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 transition ${rotation === r.value ? 'border-[var(--color-primary)]/50 bg-[var(--color-primary)]/8' : 'border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]'}`}>
                    <input type="radio" name="rotation" checked={rotation === r.value} onChange={() => setRotation(r.value)} className="mt-0.5 accent-[var(--color-primary)]" />
                    <span>
                      <span className="block text-sm font-medium text-[var(--color-text)]">{r.label}</span>
                      <span className="block text-[11px] leading-snug text-[var(--color-text-muted)]">{r.desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </Field>
          </div>
        </Card>

        <Card title="3 · Sessions" subtitle="Each session ID gets its own device" className="lg:col-span-3">
          <div className="space-y-4">
            <Field label="How many">
              <input
                type="number" min={1} max={500} value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
                aria-label="Number of proxies"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm tabular-nums text-[var(--color-text)]"
              />
              <div className="mt-2 flex flex-wrap gap-1">
                {[1, 10, 50, 100].map((v) => (
                  <button key={v} onClick={() => setCount(v)} className={`rounded-md border px-2 py-0.5 text-xs ${count === v ? 'border-[var(--color-text)] text-[var(--color-text)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>{v}</button>
                ))}
              </div>
            </Field>
            <Field label="Session prefix">
              <input
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 12))}
                placeholder="empty = no session ID"
                aria-label="Session prefix"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 font-mono text-sm text-[var(--color-text)] placeholder:font-sans placeholder:text-[var(--color-text-muted)]"
              />
            </Field>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs">
              <p className="font-medium text-[var(--color-text)]">{countryInfo(country).flag} {countryInfo(country).name}</p>
              <p className="mt-0.5 text-[var(--color-text-muted)]">{pool === 'mbl' ? 'Mobile' : 'Residential'} · {protocol.toUpperCase()} · {ROTATIONS.find((r) => r.value === rotation)?.label}</p>
              {stock && online === 0 && <p className="mt-1 text-[var(--viz-bad-text)]">No devices online here right now — requests will fail.</p>}
            </div>
            <button
              onClick={generate}
              disabled={!usable || !username}
              className="w-full rounded-lg bg-[var(--color-text)] py-2.5 text-sm font-semibold text-[var(--color-bg)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Generate {count > 1 ? `${int(count)} proxies` : 'proxy'}
            </button>
          </div>
        </Card>
      </div>

      <Card
        title={`Your proxies${lines.length > 1 ? ` (${int(lines.length)})` : ''}`}
        subtitle={sids.length ? 'One unique session per line' : 'Without a session ID · press Generate for per-session lines'}
        className="mt-4"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setReveal((r) => !r)} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]">{reveal ? 'Hide key' : 'Show key'}</button>
            <CopyButton text={lines.join('\n')} label={lines.length > 1 ? 'Copy all' : 'Copy'} variant="solid" />
            {lines.length > 1 && <button onClick={download} className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]">Download .txt</button>}
          </div>
        }
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">Format</span>
          <Segmented value={format} onChange={setFormat} options={FORMATS} />
        </div>
        <div className="max-h-72 overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
          {lines.slice(0, 200).map((l, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-[var(--color-border)] px-3 py-2 last:border-0">
              <span className="w-6 shrink-0 text-right text-[10px] tabular-nums text-[var(--color-text-muted)]">{i + 1}</span>
              <code className="min-w-0 flex-1 break-all font-mono text-[11px] text-[var(--color-text)]">{reveal ? l : maskSecret(l, key.key)}</code>
              <CopyButton text={l} />
            </div>
          ))}
        </div>
        {lines.length > 200 && <p className="mt-2 text-xs text-[var(--color-text-muted)]">Showing 200 of {int(lines.length)} — use Copy all or Download for the full list.</p>}
        {!usable && <p className="mt-2 text-xs text-[var(--viz-bad-text)]">These will be refused until the key is active again.</p>}
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        <Card title="Use it in code" subtitle="Uses the first proxy above" className="xl:col-span-3"
          action={<CopyButton text={snippets[snippet]} label="Copy code" variant="outline" />}>
          <div className="mb-3">
            <Segmented value={snippet} onChange={setSnippet} options={[{ value: 'curl', label: 'curl' }, { value: 'python', label: 'Python' }, { value: 'node', label: 'Node.js' }, { value: 'playwright', label: 'Playwright' }]} />
          </div>
          <pre className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 font-mono text-[11px] leading-relaxed text-[var(--color-text)]">{reveal ? snippets[snippet] : maskSecret(snippets[snippet], key.key)}</pre>
          <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
            More examples in the <Link href="/mobile-proxy-api" className="text-[var(--color-primary)] hover:underline">API guide</Link>.
          </p>
        </Card>

        <Card title="How the username works" className="xl:col-span-2">
          <code className="block break-all rounded-lg bg-[var(--color-bg)] p-3 font-mono text-[11px] text-[var(--color-text)]">
            {'{user}-{pool}-{country}[-sid-{id}][-rot-{mode}]'}
          </code>
          <dl className="mt-3 space-y-2 text-xs">
            {[
              ['pool', 'mbl = mobile 4G/5G, peer = residential'],
              ['country', 'two-letter code, e.g. us, de, gb'],
              ['sid', 'any id — the same id keeps the same device'],
              ['rot', 'sticky · auto10 · auto30 · hard'],
              ['host', `${GATEWAY_HOST}`],
              ['port', `${GATEWAY_HTTP_PORT} HTTP/HTTPS · ${GATEWAY_SOCKS5_PORT} SOCKS5`],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3"><dt className="w-14 shrink-0 font-mono text-[var(--color-primary)]">{k}</dt><dd className="min-w-0 break-all text-[var(--color-text-muted)]">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-3 text-[11px] text-[var(--color-text-muted)]">Changing country or rotation never needs a new key — just edit the username.</p>
        </Card>
      </div>

      {sessions.length > 0 && (
        <Card title="Recent sessions" subtitle="Saved in this browser only" className="mt-4"
          action={<button onClick={() => { setSessions([]); storeSessions([]); }} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Clear</button>}>
          <div className="-mx-5 max-h-72 overflow-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="border-b border-[var(--color-border)] text-left text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
                <th className="px-5 py-2 font-medium">Session</th><th className="px-3 py-2 font-medium">Location</th><th className="px-3 py-2 font-medium">Settings</th><th className="px-3 py-2 font-medium">Created</th><th className="px-5 py-2"><span className="sr-only">Copy</span></th>
              </tr></thead>
              <tbody>
                {sessions.slice(0, 50).map((s) => (
                  <tr key={s.sid} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-5 py-2 font-mono text-xs text-[var(--color-text)]">{s.sid}</td>
                    <td className="px-3 py-2 text-xs text-[var(--color-text)]">{countryInfo(s.country).flag} {s.country.toUpperCase()}</td>
                    <td className="px-3 py-2 text-xs text-[var(--color-text-muted)]">{s.pool === 'mbl' ? 'Mobile' : 'Residential'} · {s.protocol.toUpperCase()} · {s.rotation}</td>
                    <td className="px-3 py-2 text-xs text-[var(--color-text-muted)]">{ago(s.createdAt)}</td>
                    <td className="px-5 py-2 text-right">
                      <CopyButton text={formatProxy(username, key.key, { country: s.country, pool: s.pool, protocol: s.protocol, rotation: s.rotation as Rotation, sid: s.sid }, format)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">{label}</p>
      {children}
    </div>
  );
}
