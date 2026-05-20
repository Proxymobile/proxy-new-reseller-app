'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserProfile {
  id: string;
  label: string;
  email: string | null;
  access_code: string;
  role: string;
  created_at: string;
}

interface Wallet {
  chain: string;
  address: string;
  verified: boolean;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      isMetaMask?: boolean;
    };
  }
}

interface LocalPrefs {
  notifEmail: boolean;
  notifLowBalance: boolean;
  defaultPool: 'mbl' | 'peer';
  defaultCountry: string;
  phone: string;
  company: string;
}

const PREFS_KEY = 'proxymobile_prefs';

const DEFAULT_PREFS: LocalPrefs = {
  notifEmail: true,
  notifLowBalance: true,
  defaultPool: 'mbl',
  defaultCountry: 'us',
  phone: '',
  company: '',
};

const COUNTRIES = [
  { code: 'us', name: 'USA' },
  { code: 'de', name: 'Germany' },
  { code: 'gb', name: 'UK' },
  { code: 'fr', name: 'France' },
  { code: 'es', name: 'Spain' },
  { code: 'pl', name: 'Poland' },
  { code: 'ch', name: 'Switzerland' },
  { code: 'pa', name: 'Panama' },
  { code: 'am', name: 'Armenia' },
];

function loadPrefs(): LocalPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch { return DEFAULT_PREFS; }
}

function savePrefs(prefs: LocalPrefs) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [prefs, setPrefs] = useState<LocalPrefs>(DEFAULT_PREFS);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  const loadData = useCallback(async () => {
    const [walletRes, profileRes] = await Promise.all([
      fetch('/api/wallet/list'),
      fetch('/api/user/profile'),
    ]);
    if (walletRes.ok) {
      const data = await walletRes.json();
      setWallets(data.wallets ?? []);
    }
    if (profileRes.ok) {
      const data = await profileRes.json();
      setProfile(data.user ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function updatePref<K extends keyof LocalPrefs>(key: K, value: LocalPrefs[K]) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    savePrefs(next);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  async function connectWallet() {
    setMessage(null);
    setConnecting(true);

    try {
      if (!window.ethereum) {
        setMessage({ type: 'error', text: 'MetaMask not detected. Install MetaMask to connect your wallet.' });
        setConnecting(false);
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      const address = accounts[0];
      if (!address) {
        setMessage({ type: 'error', text: 'No account selected' });
        setConnecting(false);
        return;
      }

      const challengeRes = await fetch('/api/wallet/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chain: 'ethereum', address }),
      });
      const challengeData = await challengeRes.json();
      if (!challengeRes.ok) {
        setMessage({ type: 'error', text: challengeData.error ?? 'Failed to create challenge' });
        setConnecting(false);
        return;
      }

      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [challengeData.message, address],
      }) as string;

      const verifyRes = await fetch('/api/wallet/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nonce: challengeData.nonce, signature, address }),
      });
      const verifyData = await verifyRes.json();

      if (verifyRes.ok) {
        setMessage({ type: 'success', text: 'Wallet linked successfully! You can now use it to sign in.' });
        loadData();
      } else {
        setMessage({ type: 'error', text: verifyData.error ?? 'Verification failed' });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Wallet connection failed';
      if (errMsg.includes('User rejected') || errMsg.includes('user rejected')) {
        setMessage({ type: 'error', text: 'Signature request was rejected' });
      } else {
        setMessage({ type: 'error', text: errMsg });
      }
    }

    setConnecting(false);
  }

  function copyCode() {
    if (!profile) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(profile.access_code).catch(() => {});
    } else {
      const ta = document.createElement('textarea');
      ta.value = profile.access_code;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* ignore */ }
      document.body.removeChild(ta);
    }
    setMessage({ type: 'success', text: 'Access code copied to clipboard' });
    setTimeout(() => setMessage(null), 2000);
  }

  function maskCode(code: string) {
    const parts = code.split('-');
    return parts.map((p, i) => i === 0 ? p : '****').join('-');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Settings</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Manage your account, security, and preferences.
          </p>
        </div>
        <AnimatePresence>
          {savedFlash && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg border p-3 text-sm ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-600'
          }`}
        >
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right text-xs opacity-60 hover:opacity-100">&times;</button>
        </motion.div>
      )}

      {/* PROFILE SECTION */}
      <Section title="Profile" desc="Your account information">
        {profile && (
          <>
            <Field label="Display name" value={profile.label} />
            <Field label="Email" value={profile.email || '—'} />
            <Field
              label="Phone"
              control={
                <input
                  type="tel"
                  value={prefs.phone}
                  onChange={(e) => updatePref('phone', e.target.value)}
                  placeholder="+1 555 555 5555"
                  className="w-full sm:max-w-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-[var(--color-primary)]"
                />
              }
            />
            <Field
              label="Company"
              control={
                <input
                  type="text"
                  value={prefs.company}
                  onChange={(e) => updatePref('company', e.target.value)}
                  placeholder="Optional"
                  className="w-full sm:max-w-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-[var(--color-primary)]"
                />
              }
            />
            <Field label="Account type" value={profile.role === 'admin' ? 'Admin' : 'Customer'} />
            <Field label="Member since" value={new Date(profile.created_at).toLocaleDateString()} last />
          </>
        )}
      </Section>

      {/* SECURITY SECTION */}
      <Section title="Security" desc="Login credentials and account protection">
        {profile && (
          <Field
            label="Access code"
            control={
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-[var(--color-text)] select-all">
                  {showCode ? profile.access_code : maskCode(profile.access_code)}
                </code>
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="text-xs text-[var(--color-primary)] hover:underline font-medium"
                >
                  {showCode ? 'Hide' : 'Reveal'}
                </button>
                <button
                  onClick={copyCode}
                  className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  Copy
                </button>
              </div>
            }
          />
        )}
        <Field
          label="Two-factor authentication"
          control={
            <button
              disabled
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] cursor-not-allowed"
            >
              Coming soon
            </button>
          }
        />
        <Field
          label="Active sessions"
          control={
            <span className="text-xs text-[var(--color-text-muted)]">1 active session (this browser)</span>
          }
        />
        <Field
          label="Linked wallets"
          last
          control={
            <div className="w-full">
              {loading ? (
                <p className="text-xs text-[var(--color-text-muted)]">Loading…</p>
              ) : wallets.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {wallets.map((w) => (
                    <div
                      key={`${w.chain}-${w.address}`}
                      className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2"
                    >
                      <div>
                        <span className="text-xs font-medium text-[var(--color-text)] uppercase">{w.chain}</span>
                        <p className="text-xs font-mono text-[var(--color-text-muted)] mt-0.5">
                          {w.address.slice(0, 6)}…{w.address.slice(-4)}
                        </p>
                      </div>
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: w.verified ? '#dcfce7' : '#fef3c7',
                          color: w.verified ? '#059669' : '#d97706',
                        }}
                      >
                        {w.verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--color-text-muted)] mb-3">No wallets linked</p>
              )}
              <button
                onClick={connectWallet}
                disabled={connecting}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition disabled:opacity-40"
              >
                {connecting ? 'Connecting…' : wallets.length > 0 ? 'Link another' : 'Connect Ethereum wallet'}
              </button>
            </div>
          }
        />
      </Section>

      {/* PREFERENCES SECTION */}
      <Section title="Preferences" desc="Notifications and defaults — saved automatically">
        <Field
          label="Email notifications"
          desc="Receipts, plan expirations, important updates"
          control={
            <Toggle checked={prefs.notifEmail} onChange={(v) => updatePref('notifEmail', v)} />
          }
        />
        <Field
          label="Low balance alerts"
          desc="Get notified when your balance drops below $10"
          control={
            <Toggle checked={prefs.notifLowBalance} onChange={(v) => updatePref('notifLowBalance', v)} />
          }
        />
        <Field
          label="Default pool type"
          desc="Pre-selected when generating new proxy URLs"
          control={
            <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden text-xs font-medium">
              {(['mbl', 'peer'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => updatePref('defaultPool', p)}
                  className={`px-3 py-1.5 transition ${
                    prefs.defaultPool === p
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-white text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'
                  }`}
                >
                  {p === 'mbl' ? 'Mobile' : 'Residential'}
                </button>
              ))}
            </div>
          }
        />
        <Field
          label="Default country"
          desc="Pre-selected on the Purchase page"
          last
          control={
            <select
              value={prefs.defaultCountry}
              onChange={(e) => updatePref('defaultCountry', e.target.value)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name} ({c.code.toUpperCase()})</option>
              ))}
            </select>
          }
        />
      </Section>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <div className="px-6 py-5 border-b border-[var(--color-border)]">
        <h2 className="text-base font-semibold text-[var(--color-text)]">{title}</h2>
        {desc && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{desc}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Field({
  label, value, desc, control, last,
}: {
  label: string;
  value?: string;
  desc?: string;
  control?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`px-6 py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 ${last ? '' : 'border-b border-[var(--color-border)]'}`}>
      <div className="sm:w-1/3 sm:pr-4">
        <p className="text-sm font-medium text-[var(--color-text)]">{label}</p>
        {desc && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{desc}</p>}
      </div>
      <div className="sm:flex-1 flex sm:justify-end">
        {control ?? <span className="text-sm text-[var(--color-text)]">{value}</span>}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors ${
        checked ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
