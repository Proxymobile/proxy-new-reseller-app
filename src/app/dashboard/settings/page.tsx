'use client';

import { useCallback, useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { config } from '@/config';
import { countryInfo } from '@/lib/country-list';
import { ROTATIONS, type ProxyPool, type ProxyProtocol, type Rotation } from '@/lib/proxy-url';
import { Alert, Card, PageHeader, Status, type Level } from '@/components/panel/ui';
import { CopyButton } from '@/components/panel/CopyButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Segmented } from '../_components/QuickConnect';
import { DEFAULT_PREFS, loadPrefs, savePrefs, type DashPrefs } from '../_components/prefs';

interface Profile { id: string; label: string; email: string | null; access_code: string; role: string; created_at: string }
interface Wallet { chain: string; address: string; verified: boolean }

declare global {
  interface Window {
    ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
  }
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [reveal, setReveal] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [notice, setNotice] = useState<{ level: Level; text: string } | null>(null);
  const [prefs, setPrefs] = useState<DashPrefs>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setPrefs(loadPrefs()); }, []);

  const load = useCallback(async () => {
    const [w, p] = await Promise.all([fetch('/api/wallet/list'), fetch('/api/user/profile')]);
    if (w.ok) setWallets((await w.json()).wallets ?? []);
    if (p.ok) setProfile((await p.json()).user ?? null);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function update<K extends keyof DashPrefs>(k: K, v: DashPrefs[K]) {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    savePrefs(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function connectWallet() {
    setNotice(null);
    if (!window.ethereum) {
      setNotice({ level: 'serious', text: 'No Ethereum wallet found in this browser. Install MetaMask (or a compatible wallet) and try again.' });
      return;
    }
    setConnecting(true);
    try {
      const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[];
      const address = accounts[0];
      if (!address) throw new Error('No account selected');
      const cr = await fetch('/api/wallet/challenge', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chain: 'ethereum', address }),
      });
      const cd = await cr.json().catch(() => ({}));
      if (!cr.ok) throw new Error(cd.error ?? 'Could not start wallet verification');
      const signature = (await window.ethereum.request({ method: 'personal_sign', params: [cd.message, address] })) as string;
      const vr = await fetch('/api/wallet/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nonce: cd.nonce, signature, address }),
      });
      const vd = await vr.json().catch(() => ({}));
      if (!vr.ok) throw new Error(vd.error ?? 'Verification failed');
      setNotice({ level: 'good', text: 'Wallet linked. You can now sign in with it.' });
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Wallet connection failed';
      setNotice({ level: 'critical', text: /reject/i.test(msg) ? 'The signature request was rejected.' : msg });
    }
    setConnecting(false);
  }

  const masked = (code: string) => code.split('-').map((p, i) => (i === 0 ? p : '••••')).join('-');

  return (
    <div>
      <PageHeader title="Settings" subtitle="Your account, sign-in and proxy defaults." />
      {notice && <div className="mb-4"><Alert level={notice.level} title={notice.text} /></div>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Account">
          {loading || !profile ? <div className="h-32 animate-pulse rounded-xl bg-[var(--color-bg)]" /> : (
            <dl className="divide-y divide-[var(--color-border)] text-sm">
              <Row label="Name" value={profile.label} />
              <Row label="Email" value={profile.email ?? <span className="text-[var(--color-text-muted)]">not set</span>} />
              <Row label="Account type" value={profile.role === 'admin' ? 'Admin' : 'Customer'} />
              <Row label="Member since" value={new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
              <Row label="Account ID" value={<span className="flex items-center gap-2"><code className="font-mono text-xs">{profile.id.slice(0, 8)}</code><CopyButton text={profile.id} /></span>} />
            </dl>
          )}
          <p className="mt-3 text-[11px] text-[var(--color-text-muted)]">To change your name or email, contact <a href={`mailto:${config.brand.supportEmail}`} className="text-[var(--color-primary)] hover:underline">{config.brand.supportEmail}</a> or <a href={config.brand.supportTelegramUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">{config.brand.supportTelegram}</a> on Telegram, and include your account ID.</p>
        </Card>

        <Card title="Access code" subtitle="Your password — anyone with this code can sign in as you">
          {loading || !profile ? <div className="h-32 animate-pulse rounded-xl bg-[var(--color-bg)]" /> : (
            <>
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                <code className="font-mono text-base tracking-wider text-[var(--color-text)]">{reveal ? profile.access_code : masked(profile.access_code)}</code>
                <span className="ml-auto flex gap-3">
                  <button onClick={() => setReveal((r) => !r)} className="text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]">{reveal ? 'Hide' : 'Show'}</button>
                  <CopyButton text={profile.access_code} />
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-xs text-[var(--color-text-muted)]">
                <li>• Store it in a password manager — without a linked wallet it is the only way to sign in.</li>
                <li>• Think it leaked? Email support from the address on your account and we&apos;ll issue a new one.</li>
              </ul>
            </>
          )}
        </Card>

        <Card title="Wallet sign-in" subtitle="Link an Ethereum wallet as a second way to sign in">
          {loading ? <div className="h-16 animate-pulse rounded-xl bg-[var(--color-bg)]" /> : (
            <>
              {wallets.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">No wallet linked.</p>
              ) : (
                <ul className="space-y-2">
                  {wallets.map((w) => (
                    <li key={`${w.chain}-${w.address}`} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
                      <span className="min-w-0">
                        <span className="block text-xs font-medium capitalize text-[var(--color-text)]">{w.chain}</span>
                        <span className="block font-mono text-xs text-[var(--color-text-muted)]">{w.address.slice(0, 6)}…{w.address.slice(-4)}</span>
                      </span>
                      <Status level={w.verified ? 'good' : 'warning'}>{w.verified ? 'Verified' : 'Pending'}</Status>
                    </li>
                  ))}
                </ul>
              )}
              <button
                onClick={connectWallet}
                disabled={connecting}
                className="mt-3 rounded-lg border border-[var(--color-border)] px-3.5 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
              >
                {connecting ? 'Waiting for wallet…' : wallets.length ? 'Link another wallet' : 'Connect Ethereum wallet'}
              </button>
            </>
          )}
        </Card>

        <Card title="Proxy defaults" subtitle="Pre-selected on Proxy setup and Overview · saved in this browser" action={saved ? <Status level="good">Saved</Status> : undefined}>
          <div className="space-y-4">
            <Pref label="Pool">
              <Segmented<ProxyPool> value={prefs.pool} onChange={(v) => update('pool', v)} options={[{ value: 'mbl', label: 'Mobile' }, { value: 'peer', label: 'Residential' }]} />
            </Pref>
            <Pref label="Protocol">
              <Segmented<ProxyProtocol> value={prefs.protocol} onChange={(v) => update('protocol', v)} options={[{ value: 'http', label: 'HTTP' }, { value: 'socks5', label: 'SOCKS5' }]} />
            </Pref>
            <Pref label="Country">
              <select
                value={prefs.country}
                onChange={(e) => update('country', e.target.value)}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-sm text-[var(--color-text)]"
              >
                {config.countries.map((c) => <option key={c} value={c}>{countryInfo(c).flag} {countryInfo(c).name}</option>)}
              </select>
            </Pref>
            <Pref label="Rotation">
              <select
                value={prefs.rotation}
                onChange={(e) => update('rotation', e.target.value as Rotation)}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-sm text-[var(--color-text)]"
              >
                {ROTATIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </Pref>
          </div>
        </Card>

        <Card title="Appearance & session">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[var(--color-text)]">Theme</p>
              <p className="text-xs text-[var(--color-text-muted)]">Switch between light and dark</p>
            </div>
            <ThemeToggle />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
            <div>
              <p className="text-sm font-medium text-[var(--color-text)]">Sign out</p>
              <p className="text-xs text-[var(--color-text-muted)]">End your session on this device</p>
            </div>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="rounded-lg border border-[var(--color-border)] px-3.5 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]">
              Sign out
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-[var(--color-text-muted)]">{label}</dt>
      <dd className="min-w-0 truncate text-right text-[var(--color-text)]">{value}</dd>
    </div>
  );
}

function Pref({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-[var(--color-text)]">{label}</span>
      {children}
    </div>
  );
}
