'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const LINKS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/keys', label: 'Proxy setup' },
  { href: '/dashboard/purchase', label: 'Buy bandwidth' },
  { href: '/dashboard/billing', label: 'Billing' },
  { href: '/dashboard/settings', label: 'Settings' },
  { href: '/dashboard/support', label: 'Help & support' },
];

function isActive(pathname: string, href: string) {
  return href === '/dashboard' ? pathname === '/dashboard' : pathname === href || pathname.startsWith(`${href}/`);
}

export function DashNav({ variant, isAdmin }: { variant: 'side' | 'top'; isAdmin: boolean }) {
  const pathname = usePathname() ?? '';
  const links = isAdmin ? [...LINKS, { href: '/admin', label: 'Admin panel' }] : LINKS;

  if (variant === 'top') {
    return (
      <nav aria-label="Dashboard" className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none]">
        {links.map((l) => {
          const on = isActive(pathname, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={on ? 'page' : undefined}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${
                on ? 'bg-[var(--color-text)] text-[var(--color-bg)]' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Dashboard" className="flex-1 space-y-0.5 overflow-y-auto p-3">
      {links.map((l) => {
        const on = isActive(pathname, l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={on ? 'page' : undefined}
            className={`block rounded-lg px-3 py-2 text-sm transition ${
              on
                ? 'bg-[var(--color-surface-hover)] font-medium text-[var(--color-text)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
            } ${l.href === '/admin' ? 'mt-4 border-t border-[var(--color-border)] pt-3' : ''}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SignOutButton({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/' })}
      className={`text-sm text-[var(--color-text-muted)] transition hover:text-[var(--color-text)] ${className}`}
    >
      Sign out
    </button>
  );
}
