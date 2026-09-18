'use client';

import { useState } from 'react';

export function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(() => true, () => fallback(text));
  }
  return Promise.resolve(fallback(text));
}

function fallback(text: string) {
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

export function CopyButton({ text, label = 'Copy', className = '', variant = 'ghost' }: {
  text: string; label?: string; className?: string; variant?: 'ghost' | 'solid' | 'outline';
}) {
  const [copied, setCopied] = useState(false);
  const styles = {
    ghost: 'text-[var(--color-primary)] hover:underline',
    solid: 'rounded-lg bg-[var(--color-text)] px-3 py-1.5 text-[var(--color-bg)] hover:opacity-90',
    outline: 'rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]',
  }[variant];
  return (
    <button
      type="button"
      onClick={async () => {
        await copyText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className={`whitespace-nowrap text-xs font-medium transition ${styles} ${className}`}
      aria-live="polite"
    >
      {copied ? 'Copied ✓' : label}
    </button>
  );
}
