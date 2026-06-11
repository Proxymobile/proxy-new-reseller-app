import Link from 'next/link';
import { auth, signOut } from '@/lib/auth';
import { isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { config } from '@/config';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const admin = await isAdmin(session.user.id);
  if (!admin) redirect('/dashboard');

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col">
        <div className="p-4 border-b border-[var(--color-border)]">
          <Link href="/admin" className="text-lg font-bold text-[var(--color-text)]">
            {config.brand.name}
            <span className="ml-2 text-xs font-normal text-[var(--color-accent)]">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink href="/admin">Overview</NavLink>
          <NavLink href="/admin/accounts">Accounts</NavLink>
          <NavLink href="/admin/accounts/create">Create Account</NavLink>
          <NavLink href="/admin/billing">Billing</NavLink>
          <NavLink href="/admin/keys">All Keys</NavLink>
          <NavLink href="/admin/audit">Audit Log</NavLink>
          <NavLink href="/dashboard">Customer View</NavLink>
        </nav>
        <div className="p-4 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-muted)] truncate mb-2">
            {session.user.label ?? 'Admin'}
          </p>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/' });
            }}
          >
            <button
              type="submit"
              className="w-full text-left text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-lg px-3 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition"
    >
      {children}
    </Link>
  );
}
