import Link from 'next/link';
import { auth, signOut } from '@/lib/auth';
import { isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { config } from '@/config';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AdminNav } from './_components/AdminNav';

// Admin data is live — never serve a cached render.
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const admin = await isAdmin(session.user.id);
  if (!admin) redirect('/dashboard');

  const signOutForm = (
    <form
      action={async () => {
        'use server';
        await signOut({ redirectTo: '/' });
      }}
    >
      <button type="submit" className="text-sm text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]">
        Sign out
      </button>
    </form>
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg)] lg:flex">
      {/* Mobile / tablet top bar */}
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)] lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/admin" className="text-base font-bold text-[var(--color-text)]">
            {config.brand.name}
            <span className="ml-2 text-xs font-normal text-[var(--color-accent)]">Admin</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {signOutForm}
          </div>
        </div>
        <AdminNav variant="top" />
      </header>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:flex">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4">
          <Link href="/admin" className="text-lg font-bold text-[var(--color-text)]">
            {config.brand.name}
            <span className="ml-2 text-xs font-normal text-[var(--color-accent)]">Admin</span>
          </Link>
          <ThemeToggle />
        </div>
        <AdminNav variant="side" />
        <div className="border-t border-[var(--color-border)] p-4">
          <p className="mb-2 truncate text-xs text-[var(--color-text-muted)]">{session.user.label ?? 'Admin'}</p>
          {signOutForm}
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
