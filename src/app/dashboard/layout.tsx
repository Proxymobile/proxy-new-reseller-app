import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { queryOne } from '@/lib/db';
import { Sidebar } from './_components/Sidebar';
import { TopBarWithSignOut } from './_components/SignOutWrapper';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const sessionUser = session.user as { id: string; label?: string; role?: string; email?: string };

  const userRow = await queryOne<{ balance_usd: string; email: string | null; label: string }>(
    'SELECT balance_usd, email, label FROM users WHERE id = $1',
    [sessionUser.id],
  );
  const balance = Number(userRow?.balance_usd ?? 0);
  const isAdmin = sessionUser.role === 'admin';

  return (
    <div className="min-h-screen flex bg-[var(--color-bg)]">
      <Sidebar isAdmin={isAdmin} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBarWithSignOut
          userLabel={userRow?.label || sessionUser.label || 'Account'}
          userEmail={userRow?.email || sessionUser.email || null}
          balance={balance}
        />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl w-full">{children}</main>
      </div>
    </div>
  );
}
