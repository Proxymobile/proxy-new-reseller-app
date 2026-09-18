import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { config } from '@/config';
import { getAccountUser } from '@/lib/customer-data';
import { ThemeToggle } from '@/components/ThemeToggle';
import { usd } from '@/components/panel/format';
import { DashNav, SignOutButton } from './_components/DashNav';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await getAccountUser(session.user.id);
  if (!user) redirect('/login');
  const isAdmin = session.user.role === 'admin';

  const balanceChip = (
    <Link
      href="/dashboard/billing"
      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 transition hover:border-[var(--color-primary)]/40"
    >
      <span>
        <span className="block text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Balance</span>
        <span className="block text-sm font-semibold tabular-nums text-[var(--color-text)]">{usd(user.balance)}</span>
      </span>
      <span className="rounded-md bg-[var(--color-text)] px-2 py-1 text-[11px] font-semibold text-[var(--color-bg)]">Add funds</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg)] lg:flex">
      {/* Mobile / tablet */}
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)] lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Link href="/dashboard" aria-label={`${config.brand.name} dashboard`}>
            <Image src="/logo.png" alt={config.brand.name} width={1516} height={429} className="h-7 w-auto dark:invert" priority />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/billing" className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-semibold tabular-nums text-[var(--color-text)]">
              {usd(user.balance)}
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <DashNav variant="top" isAdmin={isAdmin} />
      </header>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:flex">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4">
          <Link href="/dashboard" aria-label={`${config.brand.name} dashboard`}>
            <Image src="/logo.png" alt={config.brand.name} width={1516} height={429} className="h-9 w-auto dark:invert" priority />
          </Link>
          <ThemeToggle />
        </div>
        <div className="p-3 pb-0">{balanceChip}</div>
        <DashNav variant="side" isAdmin={isAdmin} />
        <div className="border-t border-[var(--color-border)] p-4">
          <p className="truncate text-sm font-medium text-[var(--color-text)]">{user.label}</p>
          {user.email && <p className="truncate text-xs text-[var(--color-text-muted)]">{user.email}</p>}
          <SignOutButton className="mt-2" />
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
