'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { config } from '@/config';

type Mode = 'login' | 'signup' | 'signup-result';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');

  // Login state
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Signup state
  const [signupLabel, setSignupLabel] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  // Wallet state
  const [walletLoading, setWalletLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('access-code', {
      accessCode: accessCode.trim(),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid or disabled access code');
    } else {
      window.location.href = '/dashboard';
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSignupLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: signupLabel.trim() || undefined }),
      });
      const data = await res.json();
      setSignupLoading(false);

      if (!res.ok) {
        setError(data.error ?? 'Failed to create account');
        return;
      }

      setGeneratedCode(data.accessCode);
      setMode('signup-result');
    } catch {
      setSignupLoading(false);
      setError('Something went wrong');
    }
  }

  async function handleWalletLogin() {
    setError('');
    setWalletLoading(true);

    try {
      if (!window.ethereum) {
        setError('MetaMask not detected. Install MetaMask to sign in with your wallet.');
        setWalletLoading(false);
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      const address = accounts[0];
      if (!address) {
        setError('No account selected');
        setWalletLoading(false);
        return;
      }

      // Get challenge
      const challengeRes = await fetch('/api/auth/wallet-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const challenge = await challengeRes.json();
      if (!challengeRes.ok) {
        setError(challenge.error ?? 'Failed to get challenge');
        setWalletLoading(false);
        return;
      }

      // Sign message
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [challenge.message, address],
      }) as string;

      // Authenticate
      const result = await signIn('wallet', {
        address,
        signature,
        nonce: challenge.nonce,
        hmac: challenge.hmac,
        redirect: false,
      });

      if (result?.error) {
        setError('No account linked to this wallet. Create an account first, then link your wallet in Settings.');
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Wallet login failed';
      if (msg.includes('User rejected') || msg.includes('user rejected')) {
        setError('Signature request was rejected');
      } else {
        setError(msg);
      }
    }

    setWalletLoading(false);
  }

  function useGeneratedCode() {
    setAccessCode(generatedCode);
    setMode('login');
    setGeneratedCode('');
    setSignupLabel('');
  }

  function formatInput(value: string) {
    const clean = value.replace(/[^a-f0-9]/gi, '').toLowerCase();
    const parts = [];
    for (let i = 0; i < clean.length && i < 16; i += 4) {
      parts.push(clean.slice(i, i + 4));
    }
    return parts.join('-');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--color-bg)]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as const }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-[var(--color-text)]" aria-label={config.brand.name}>
            <svg viewBox="0 0 32 32" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round">
              <circle cx="16" cy="16" r="14" />
              <path d="M16 6 L23.5 10.4 L23.5 21.6 L16 26 L8.5 21.6 L8.5 10.4 Z" />
              <line x1="16" y1="16" x2="16" y2="6" />
              <line x1="16" y1="16" x2="23.5" y2="10.4" />
              <line x1="16" y1="16" x2="23.5" y2="21.6" />
              <line x1="16" y1="16" x2="16" y2="26" />
              <line x1="16" y1="16" x2="8.5" y2="21.6" />
              <line x1="16" y1="16" x2="8.5" y2="10.4" />
              <circle cx="16" cy="16" r="1.8" fill="currentColor" stroke="none" />
            </svg>
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {/* === LOGIN MODE === */}
          {mode === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <div className="text-center mb-6">
                <h1 className="text-lg font-semibold text-[var(--color-text)]">Welcome back</h1>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Enter your access code to continue
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-premium edge-light">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label htmlFor="accessCode" className="block text-xs font-medium text-[var(--color-text-muted)] mb-2">
                      Access Code
                    </label>
                    <input
                      id="accessCode"
                      type="text"
                      required
                      autoFocus
                      autoComplete="off"
                      spellCheck={false}
                      value={accessCode}
                      onChange={(e) => setAccessCode(formatInput(e.target.value))}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-2.5 text-center text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] font-mono tracking-[0.2em] text-sm transition-all"
                      placeholder="xxxx-xxxx-xxxx-xxxx"
                      maxLength={19}
                    />
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-500 text-center"
                    >
                      {error}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || accessCode.replace(/-/g, '').length < 16}
                    className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-colors shadow-sm shadow-[var(--color-primary)]/25 disabled:opacity-30"
                  >
                    {loading ? 'Signing in...' : 'Continue'}
                  </button>
                </form>

                {/* Create account button (purple) */}
                <button
                  onClick={() => { setMode('signup'); setError(''); }}
                  className="mt-3 w-full rounded-lg border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-4 py-2.5 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/15 transition-colors"
                >
                  Create Account
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-[var(--color-border)]" />
                  <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-[var(--color-border)]" />
                </div>

                {/* Wallet Login */}
                <button
                  onClick={handleWalletLogin}
                  disabled={walletLoading}
                  className="w-full rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                  </svg>
                  {walletLoading ? 'Connecting...' : 'Connect with Wallet'}
                </button>

              </div>
            </motion.div>
          )}

          {/* === SIGNUP MODE === */}
          {mode === 'signup' && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <div className="text-center mb-6">
                <h1 className="text-lg font-semibold text-[var(--color-text)]">Create Account</h1>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  No email required. Get an instant access code.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-premium edge-light">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <label htmlFor="label" className="block text-xs font-medium text-[var(--color-text-muted)] mb-2">
                      Username <span className="text-[var(--color-text-muted)]/50">(optional)</span>
                    </label>
                    <input
                      id="label"
                      type="text"
                      autoFocus
                      value={signupLabel}
                      onChange={(e) => setSignupLabel(e.target.value)}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
                      placeholder="e.g. alice, anon-42"
                      maxLength={50}
                    />
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-500 text-center"
                    >
                      {error}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={signupLoading}
                    className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-colors shadow-sm shadow-[var(--color-primary)]/25 disabled:opacity-30"
                  >
                    {signupLoading ? 'Creating...' : 'Generate Access Code'}
                  </button>
                </form>
              </div>

              <p className="mt-6 text-center">
                <button
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-xs text-[var(--color-primary)] hover:underline"
                >
                  Already have a code? Sign in
                </button>
              </p>
            </motion.div>
          )}

          {/* === SIGNUP RESULT === */}
          {mode === 'signup-result' && (
            <motion.div
              key="signup-result"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-6">
                <h1 className="text-lg font-semibold text-[var(--color-text)]">Your Access Code</h1>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Save this code — it will not be shown again.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--color-accent)]/40 bg-[var(--color-surface)] p-6 shadow-premium edge-light">
                <div className="rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)] p-4 mb-4">
                  <p className="text-2xl font-mono font-bold text-[var(--color-primary)] tracking-wider select-all text-center">
                    {generatedCode}
                  </p>
                </div>

                <p className="text-xs text-red-500 text-center mb-4">
                  This is your only login credential. Copy it now and store it safely.
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedCode)}
                    className="w-full rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    Copy to Clipboard
                  </button>
                  <button
                    onClick={useGeneratedCode}
                    className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-colors shadow-sm shadow-[var(--color-primary)]/25"
                  >
                    Sign In Now
                  </button>
                </div>
              </div>

              <p className="mt-6 text-center text-xs text-[var(--color-text-muted)] leading-relaxed">
                After signing in, link your wallet in Settings<br />
                to enable wallet-based login.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 text-center text-[10px] text-[var(--color-text-muted)]">
          <a href={`mailto:${config.brand.supportEmail}`} className="hover:underline">
            Contact support
          </a>
        </p>
      </motion.div>
    </div>
  );
}
