import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { Alert, Card, Empty, PageHeader, Th } from '@/components/panel/ui';
import { CreateAdmin, AdminActions, AdminRowCells, ChangeOwnPassword, type AdminRow } from './AdminManager';

interface DbRow {
  id: string;
  label: string;
  email: string | null;
  enabled: boolean;
  has_password: boolean;
  must_change_password: boolean;
  created_at: Date;
  last_login_at: Date | null;
  password_updated_at: Date | null;
}

export default async function AdminsPage() {
  const session = await auth();
  const myId = session?.user?.id ?? '';

  const [rows, me] = await Promise.all([
    query<DbRow>(`
      SELECT id, label, email, enabled, created_at, last_login_at, password_updated_at,
             password_hash IS NOT NULL AS has_password,
             COALESCE(must_change_password, false) AS must_change_password
      FROM users
      WHERE role = 'admin'
      ORDER BY created_at ASC
    `, []),
    queryOne<{ has_password: boolean }>(
      'SELECT password_hash IS NOT NULL AS has_password FROM users WHERE id = $1',
      [myId],
    ),
  ]);

  const admins: AdminRow[] = rows.map((r) => ({
    id: r.id,
    label: r.label,
    email: r.email,
    enabled: r.enabled,
    hasPassword: r.has_password,
    mustChangePassword: r.must_change_password,
    createdAt: new Date(r.created_at).toISOString(),
    lastLoginAt: r.last_login_at ? new Date(r.last_login_at).toISOString() : null,
    passwordUpdatedAt: r.password_updated_at ? new Date(r.password_updated_at).toISOString() : null,
    isSelf: r.id === myId,
  }));

  const withoutEmail = admins.filter((a) => !a.email).length;

  return (
    <div>
      <PageHeader
        title="Admin logins"
        subtitle="Staff accounts that can open this panel. Each can sign in with an email and password, and still has its access code as a fallback."
      />

      {process.env.ADMIN_PASSWORD && (
        <div className="mb-4">
          <Alert level="warning" title="A shared ADMIN_PASSWORD is still set">
            The environment still has <code className="rounded bg-[var(--color-surface-hover)] px-1">ADMIN_PASSWORD</code>, which
            signs anyone who knows it in as the first admin account — with no record of who it was. Now that named logins exist,
            remove that variable and redeploy.
          </Alert>
        </div>
      )}

      {withoutEmail > 0 && (
        <div className="mb-4">
          <Alert level="neutral" title={`${withoutEmail} admin account${withoutEmail === 1 ? ' has' : 's have'} no email`}>
            Those accounts can only sign in with their access code. Set an email and password from the accounts page to give them a named login.
          </Alert>
        </div>
      )}

      <div className="mb-4">
        <CreateAdmin />
      </div>

      <Card title="Admins" subtitle={`${admins.length} account${admins.length === 1 ? '' : 's'} with panel access`}>
        {admins.length === 0 ? <Empty>No admin accounts</Empty> : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead><tr className="border-b border-[var(--color-border)]">
                <Th className="pl-5">Name</Th>
                <Th>Email</Th>
                <Th>Login</Th>
                <Th>Status</Th>
                <Th>Last sign-in</Th>
                <Th className="pr-5 text-right">Actions</Th>
              </tr></thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id} className="border-b border-[var(--color-border)] last:border-0">
                    <AdminRowCells admin={a} />
                    <td className="py-3 pr-5 text-right align-top"><AdminActions admin={a} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mt-4">
        <Card
          title="Your password"
          subtitle={me?.has_password
            ? 'Change the password you use to sign in.'
            : 'Your account signs in with an access code. Set a password to use your email instead.'}
        >
          <ChangeOwnPassword hasPassword={!!me?.has_password} />
        </Card>
      </div>
    </div>
  );
}
