'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { config } from '@/config';
import {
  IconHome, IconCart, IconKey, IconBilling, IconSettings,
  IconSupport, IconShield, IconMenu, IconX,
} from './icons';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: IconHome },
  { href: '/dashboard/purchase', label: 'Purchase', icon: IconCart },
  { href: '/dashboard/keys', label: 'Proxy Keys', icon: IconKey },
  { href: '/dashboard/billing', label: 'Billing', icon: IconBilling },
  { href: '/dashboard/settings', label: 'Settings', icon: IconSettings },
  { href: '/dashboard/support', label: 'Support', icon: IconSupport },
];

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile menu trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-[var(--color-text)] shadow-sm"
        aria-label="Open menu"
      >
        <IconMenu />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/30"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col shrink-0 transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <Link href="/" className="flex items-center" aria-label={config.brand.name}>
            <Image
              src="/logo.png"
              alt={config.brand.name}
              width={1516}
              height={429}
              className="h-7 w-auto dark:invert"
              priority
            />
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            aria-label="Close menu"
          >
            <IconX />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                  active
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[var(--color-primary)]' : ''}`} />
                {label}
              </Link>
            );
          })}

          {isAdmin && (
            <div className="pt-3 mt-3 border-t border-[var(--color-border)]">
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-all"
              >
                <IconShield className="h-4 w-4 shrink-0" />
                Admin Panel
              </Link>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border)]">
          <p className="text-[10px] text-[var(--color-text-muted)]">
            v1.0 · {config.brand.name}
          </p>
        </div>
      </aside>
    </>
  );
}
