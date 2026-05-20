'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { IconBell, IconPlus, IconChevronDown, IconLogOut, IconWallet } from './icons';
import { ThemeToggle } from './ThemeToggle';

interface TopBarProps {
  userLabel: string;
  userEmail: string | null;
  balance: number;
  onSignOut: () => void;
}

export function TopBar({ userLabel, userEmail, balance, onSignOut }: TopBarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const initials = userLabel
    .split(/[\s_-]/)
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join('') || 'U';

  return (
    <div className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/85 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-3 pl-16 pr-4 sm:px-6 lg:pl-8 lg:pr-8">
        {/* Welcome */}
        <div className="hidden sm:block">
          <p className="text-xs text-[var(--color-text-muted)]">Welcome back</p>
          <p className="text-sm font-semibold text-[var(--color-text)] -mt-0.5">{userLabel}</p>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Balance pill */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5">
            <IconWallet className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <span className="text-xs text-[var(--color-text-muted)]">Balance:</span>
            <span className="text-sm font-semibold text-[var(--color-text)]">${balance.toFixed(2)}</span>
          </div>

          {/* Add Funds */}
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition shadow-sm shadow-[var(--color-primary)]/20"
          >
            <IconPlus className="h-3.5 w-3.5" />
            Add Funds
          </Link>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
              className="relative rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition"
              aria-label="Notifications"
            >
              <IconBell className="h-4 w-4" />
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl shadow-black/10 overflow-hidden"
                >
                  <div className="p-4 border-b border-[var(--color-border)]">
                    <p className="text-sm font-semibold text-[var(--color-text)]">Notifications</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-xs text-[var(--color-text-muted)]">You&apos;re all caught up</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile dropdown */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
              className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 hover:bg-[var(--color-surface-hover)] transition"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)] text-[11px] font-semibold text-white">
                {initials}
              </div>
              <IconChevronDown className="h-3 w-3 text-[var(--color-text-muted)]" />
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl shadow-black/10 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-[var(--color-border)]">
                    <p className="text-sm font-semibold text-[var(--color-text)] truncate">{userLabel}</p>
                    {userEmail && (
                      <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">{userEmail}</p>
                    )}
                  </div>
                  <div className="py-1.5">
                    <Link
                      href="/dashboard/settings"
                      className="block px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition"
                      onClick={() => setProfileOpen(false)}
                    >
                      Account Settings
                    </Link>
                    <Link
                      href="/dashboard/billing"
                      className="block px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition"
                      onClick={() => setProfileOpen(false)}
                    >
                      Billing
                    </Link>
                    <Link
                      href="/dashboard/support"
                      className="block px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition"
                      onClick={() => setProfileOpen(false)}
                    >
                      Support
                    </Link>
                  </div>
                  <div className="py-1.5 border-t border-[var(--color-border)]">
                    <button
                      onClick={() => { setProfileOpen(false); onSignOut(); }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition"
                    >
                      <IconLogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
