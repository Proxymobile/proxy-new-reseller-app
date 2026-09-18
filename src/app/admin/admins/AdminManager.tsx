'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CopyButton } from '@/components/panel/CopyButton';
import { Status, Td } from '@/components/panel/ui';
import { ago } from '@/components/panel/format';

export interface AdminRow {
  id: string;
  label: string;
  email: string | null;
  enabled: boolean;
  hasPassword: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  passwordUpdatedAt: string | null;
  isSelf: boolean;
}

const INPUT = 'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20';

/** Shown once after a create or reset — the plaintext is never stored. */
function SecretPanel({ title, email, password, onDone }: {
  title: string; email?: string | null; password: string; onDone: () => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-accent)]/50 bg-[var(--color-surface)] p-5">
      <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
      <p className="mt-1 text-xs text-red-500">
        This password is shown once and is not stored anywhere in readable form. Copy it now.
      </p>
      {email && (
        <div className="mt-4">
          <p className="text-xs text-[var(--color-text-muted)]">Email</p>
          <p className="select-all font-mono text-sm text-[var(--color-text)]">{email}</p>
        </div>
      )}
      <div className="mt-3">
        <p className="text-xs text-[var(--color-text-muted)]">Temporary password</p>
        <p className="select-all break-all font-mono text-lg font-bold tracking-wide text-[var(--color-primary)]">{password}</p>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <CopyButton text={password} label="Copy password" variant="outline" />
        <button type="button" onClick={onDone} className="text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
          Done
        </button>
      </div>
      <p className="mt-3 text-xs text-[var(--color-text-muted)]">
        They will be asked to set their own password after signing in.
      </p>
    </div>
  );
}

export function CreateAdmin() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await fetch('/api/admin/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: label.trim(), email: email.trim(), password: password || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? 'Could not create admin');
      return;
    }
    setCreated({ email: data.email ?? email.trim(), password: data.password ?? password });
    setLabel(''); setEmail(''); setPassword(''); setOpen(false);
    router.refresh();
  }

  if (created) {
    return (
      <SecretPanel
        title={`Admin login created for ${created.email}`}
        email={created.email}
        password={created.password}
        onDone={() => setCreated(null)}
      />
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-medium text-white transition hover:opacity-90"
      >
        + New admin login
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">New admin login</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="admin-label" className="mb-1 block text-xs text-[var(--color-text-muted)]">Name</label>
          <input id="admin-label" className={INPUT} value={label} onChange={(e) => setLabel(e.target.value)} required maxLength={50} autoFocus placeholder="e.g. Lukas" />
        </div>
        <div>
          <label htmlFor="admin-email" className="mb-1 block text-xs text-[var(--color-text-muted)]">Email (the login)</label>
          <input id="admin-email" type="email" className={INPUT} value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={120} placeholder="name@proxymobile.shop" autoComplete="off" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="admin-password" className="mb-1 block text-xs text-[var(--color-text-muted)]">
            Password <span className="text-[var(--color-text-muted)]/60">(leave blank to generate a strong one)</span>
          </label>
          <input id="admin-password" type="text" className={INPUT} value={password} onChange={(e) => setPassword(e.target.value)} maxLength={200} placeholder="Generated automatically" autoComplete="new-password" />
          <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
            At least 12 characters, with an uppercase letter, a lowercase letter and a digit.
          </p>
        </div>
      </div>
      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={busy} className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-30">
          {busy ? 'Creating…' : 'Create admin'}
        </button>
        <button type="button" onClick={() => { setOpen(false); setError(''); }} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function AdminActions({ admin }: { admin: AdminRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [issued, setIssued] = useState<string | null>(null);

  async function act(action: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setError('');
    setBusy(action);
    const res = await fetch('/api/admin/admins', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: admin.id, action }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? 'Action failed');
      return;
    }
    if (data.password) setIssued(data.password);
    router.refresh();
  }

  if (issued) {
    return (
      <div className="min-w-[220px]">
        <SecretPanel
          title={`New password for ${admin.label}`}
          email={admin.email}
          password={issued}
          onDone={() => setIssued(null)}
        />
      </div>
    );
  }

  const btn = 'whitespace-nowrap text-xs font-medium transition disabled:opacity-40';

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <button type="button" className={`${btn} text-[var(--color-primary)] hover:underline`} disabled={busy !== null} onClick={() => act('reset_password')}>
        {busy === 'reset_password' ? '…' : admin.hasPassword ? 'Reset password' : 'Set password'}
      </button>
      {admin.hasPassword && !admin.isSelf && (
        <button type="button" className={`${btn} text-[var(--color-text-muted)] hover:text-[var(--color-text)]`} disabled={busy !== null}
          onClick={() => act('clear_password', `Remove password login for ${admin.label}? Their access code will still work.`)}>
          {busy === 'clear_password' ? '…' : 'Remove password'}
        </button>
      )}
      {!admin.isSelf && (
        <>
          <button type="button" className={`${btn} text-[var(--color-text-muted)] hover:text-[var(--color-text)]`} disabled={busy !== null}
            onClick={() => act('toggle_enabled', `${admin.enabled ? 'Disable' : 'Enable'} ${admin.label}?`)}>
            {busy === 'toggle_enabled' ? '…' : admin.enabled ? 'Disable' : 'Enable'}
          </button>
          <button type="button" className={`${btn} text-red-500 hover:underline`} disabled={busy !== null}
            onClick={() => act('revoke_admin', `Remove admin rights from ${admin.label}? They become a normal customer account.`)}>
            {busy === 'revoke_admin' ? '…' : 'Revoke admin'}
          </button>
        </>
      )}
      {error && <span className="w-full text-right text-xs text-red-500">{error}</span>}
    </div>
  );
}

export function AdminRowCells({ admin }: { admin: AdminRow }) {
  return (
    <>
      <Td className="pl-5">
        <span className="text-[var(--color-text)]">{admin.label}</span>
        {admin.isSelf && <span className="ml-2 text-[11px] text-[var(--color-text-muted)]">(you)</span>}
      </Td>
      <Td className="font-mono text-xs text-[var(--color-text-muted)]">{admin.email ?? '—'}</Td>
      <Td>
        {admin.hasPassword
          ? <Status level={admin.mustChangePassword ? 'warning' : 'good'}>{admin.mustChangePassword ? 'must change' : 'password set'}</Status>
          : <Status level="neutral">access code only</Status>}
      </Td>
      <Td><Status level={admin.enabled ? 'good' : 'critical'}>{admin.enabled ? 'enabled' : 'disabled'}</Status></Td>
      <Td className="text-xs text-[var(--color-text-muted)]">{ago(admin.lastLoginAt)}</Td>
    </>
  );
}

/** Change-your-own-password form, shown on the admins page. */
export function ChangeOwnPassword({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setDone(false);
    if (next !== confirm) {
      setError('The two new passwords do not match');
      return;
    }
    setBusy(true);
    const res = await fetch('/api/admin/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current || undefined, newPassword: next }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? 'Could not change password');
      return;
    }
    setCurrent(''); setNext(''); setConfirm('');
    setDone(true);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid max-w-md gap-3">
      {hasPassword && (
        <div>
          <label htmlFor="cur-pw" className="mb-1 block text-xs text-[var(--color-text-muted)]">Current password</label>
          <input id="cur-pw" type="password" className={INPUT} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
        </div>
      )}
      <div>
        <label htmlFor="new-pw" className="mb-1 block text-xs text-[var(--color-text-muted)]">New password</label>
        <input id="new-pw" type="password" className={INPUT} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required minLength={12} />
      </div>
      <div>
        <label htmlFor="cf-pw" className="mb-1 block text-xs text-[var(--color-text-muted)]">Confirm new password</label>
        <input id="cf-pw" type="password" className={INPUT} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required minLength={12} />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {done && <p className="text-xs text-emerald-500">Password updated.</p>}
      <div>
        <button type="submit" disabled={busy} className="rounded-lg bg-[var(--color-text)] px-3 py-2 text-xs font-medium text-[var(--color-bg)] transition hover:opacity-90 disabled:opacity-30">
          {busy ? 'Saving…' : hasPassword ? 'Change password' : 'Set password'}
        </button>
      </div>
    </form>
  );
}
