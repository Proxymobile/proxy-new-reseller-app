import { NextResponse } from 'next/server';
import { auth, isAdmin, setUserPassword } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';
import { query, queryOne } from '@/lib/db';

/** Self-service password change for the signed-in admin. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { currentPassword, newPassword } = body as Record<string, unknown>;
  if (typeof newPassword !== 'string' || newPassword.length === 0) {
    return NextResponse.json({ error: 'New password is required' }, { status: 400 });
  }

  const me = await queryOne<{ password_hash: string | null }>(
    'SELECT password_hash FROM users WHERE id = $1',
    [session.user.id],
  );

  // An account that already has a password must prove it knows the old one —
  // otherwise a borrowed session could silently take the account over.
  if (me?.password_hash) {
    if (typeof currentPassword !== 'string' || !(await verifyPassword(currentPassword, me.password_hash))) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }
  }

  const problem = await setUserPassword(session.user.id, newPassword, { mustChange: false });
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  await query(
    `INSERT INTO audit_log (actor_id, action, target_type, target_id)
     VALUES ($1, 'admin_password_changed', 'user', $2)`,
    [session.user.id, session.user.id],
  ).catch(() => {});

  return NextResponse.json({ success: true });
}
