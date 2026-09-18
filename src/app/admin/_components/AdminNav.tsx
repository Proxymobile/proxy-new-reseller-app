'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const GROUPS = [
  {
    title: 'Monitor',
    links: [
      { href: '/admin', label: 'Overview' },
      { href: '/admin/usage', label: 'Bandwidth & keys' },
      { href: '/admin/traffic', label: 'Site traffic' },
      { href: '/admin/seo', label: 'SEO' },
      { href: '/admin/pool', label: 'Proxy pool' },
    ],
  },
  {
    title: 'Manage',
    links: [
      { href: '/admin/accounts', label: 'Accounts' },
      { href: '/admin/accounts/create', label: 'Create account' },
      { href: '/admin/billing', label: 'Billing' },
      { href: '/admin/promos', label: 'Promo codes' },
      { href: '/admin/keys', label: 'All keys' },
      { href: '/admin/admins', label: 'Admin logins' },
      { href: '/admin/audit', label: 'Audit log' },
    ],
  },
  {
    title: 'Other',
    links: [{ href: '/dashboard', label: 'Customer view' }],
  },
];

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  if (href === '/admin/accounts') return pathname === '/admin/accounts' || /^\/admin\/accounts\/(?!create)/.test(pathname);
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ variant }: { variant: 'side' | 'top' }) {
  const pathname = usePathname() ?? '';
  if (variant === 'top') {
    return (
      <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none]">
        {GROUPS.flatMap((g) => g.links).map((l) => {
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
    <nav aria-label="Admin" className="flex-1 space-y-5 overflow-y-auto p-3">
      {GROUPS.map((g) => (
        <div key={g.title}>
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{g.title}</p>
          <div className="space-y-0.5">
            {g.links.map((l) => {
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
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
