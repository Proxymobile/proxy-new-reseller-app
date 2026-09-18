import { NextResponse } from 'next/server';
import { auth, isAdmin, createAdminLogin, setUserPassword, clearUserPassword } from '@/lib/auth';
import { generateTempPassword } from '@/lib/password';
import { query, queryOne } from '@/lib/db';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) return null;
  return session.user.id;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function GET() {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admins = await query(`
    SELECT id, label, email, enabled, created_at, last_login_at,
           password_hash IS NOT NULL AS has_password,
           password_updated_at, must_change_password
    FROM users
    WHERE role = 'admin'
    ORDER BY created_at ASC
  `, []);

  return NextResponse.json({ admins });
}

export async function POST(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { label, email, password } = body as Record<string, unknown>;

  if (typeof label !== 'string' || label.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }

  // An omitted password means "generate one for me" — it is returned once.
  const generated = typeof password !== 'string' || password.length === 0;
  const pw = generated ? generateTempPassword() : password;

  const result = await createAdminLogin({ label: label.trim(), email: email.trim(), password: pw });
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await query(
    `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
     VALUES ($1, 'admin_login_created', 'user', $2, $3)`,
    [adminId, result.user.id, JSON.stringify({ label: result.user.label, email: result.user.email })],
  ).catch(() => {});

  return NextResponse.json({
    id: result.user.id,
    label: result.user.label,
    email: result.user.email,
    accessCode: result.user.access_code,
    // Shown once in the UI, never stored in plaintext anywhere.
    password: generated ? pw : undefined,
  }, { status: 201 });
}

export async function PATCH(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { userId, action, password } = body as Record<string, unknown>;
  if (typeof userId !== 'string' || typeof action !== 'string') {
    return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 });
  }

  const target = await queryOne<{ id: string; role: string; enabled: boolean; label: string }>(
    'SELECT id, role, enabled, label FROM users WHERE id = $1',
    [userId],
  );
  if (!target || target.role !== 'admin') {
    return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
  }

  switch (action) {
    case 'reset_password': {
      const generated = typeof password !== 'string' || password.length === 0;
      const pw = generated ? generateTempPassword() : password;
      const problem = await setUserPassword(userId, pw, { mustChange: true });
      if (problem) return NextResponse.json({ error: problem }, { status: 400 });

      await query(
        `INSERT INTO audit_log (actor_id, action, target_type, target_id)
         VALUES ($1, 'admin_password_reset', 'user', $2)`,
        [adminId, userId],
      ).catch(() => {});

      return NextResponse.json({ success: true, password: generated ? pw : undefined });
    }

    case 'clear_password': {
      await clearUserPassword(userId);
      await query(
        `INSERT INTO audit_log (actor_id, action, target_type, target_id)
         VALUES ($1, 'admin_password_cleared', 'user', $2)`,
        [adminId, userId],
      ).catch(() => {});
      return NextResponse.json({ success: true });
    }

    case 'toggle_enabled': {
      // Locking yourself out of the panel is never the intent.
      if (userId === adminId) {
        return NextResponse.json({ error: 'You cannot disable your own account' }, { status: 400 });
      }
      // Never leave the panel with no way in.
      if (target.enabled) {
        const others = await queryOne<{ count: string }>(
          "SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND enabled = true AND id <> $1",
          [userId],
        );
        if (Number(others?.count ?? 0) === 0) {
          return NextResponse.json({ error: 'This is the last enabled admin' }, { status: 400 });
        }
      }
      await query('UPDATE users SET enabled = NOT enabled, updated_at = now() WHERE id = $1', [userId]);
      await query(
        `INSERT INTO audit_log (actor_id, action, target_type, target_id)
         VALUES ($1, 'admin_toggled', 'user', $2)`,
        [adminId, userId],
      ).catch(() => {});
      return NextResponse.json({ success: true });
    }

    case 'revoke_admin': {
      if (userId === adminId) {
        return NextResponse.json({ error: 'You cannot remove your own admin role' }, { status: 400 });
      }
      const others = await queryOne<{ count: string }>(
        "SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND enabled = true AND id <> $1",
        [userId],
      );
      if (Number(others?.count ?? 0) === 0) {
        return NextResponse.json({ error: 'This is the last enabled admin' }, { status: 400 });
      }
      await query("UPDATE users SET role = 'customer', updated_at = now() WHERE id = $1", [userId]);
      await query(
        `INSERT INTO audit_log (actor_id, action, target_type, target_id)
         VALUES ($1, 'admin_revoked', 'user', $2)`,
        [adminId, userId],
      ).catch(() => {});
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
