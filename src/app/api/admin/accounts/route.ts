import { NextResponse } from 'next/server';
import { auth, isAdmin, createAccount, regenerateAccessCode } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const accounts = await query(`
    SELECT
      u.id, u.label, u.email, u.role, u.enabled, u.balance_usd, u.created_at, u.updated_at,
      c.id AS customer_id, c.pak_key_id, c.traffic_cap_gb, c.traffic_used_gb,
      c.plan_id, c.expires_at,
      (SELECT json_agg(json_build_object('chain', w.chain, 'address', w.address, 'verified', w.verified))
       FROM wallet_links w WHERE w.user_id = u.id) AS wallets
    FROM users u
    LEFT JOIN customers c ON c.user_id = u.id
    ORDER BY u.created_at DESC
  `, []);

  return NextResponse.json({ accounts });
}

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

  const { label, role, email } = body as Record<string, unknown>;

  if (!label || typeof label !== 'string' || label.trim().length === 0) {
    return NextResponse.json({ error: 'Label is required' }, { status: 400 });
  }

  if (role && role !== 'customer' && role !== 'admin') {
    return NextResponse.json({ error: 'Role must be customer or admin' }, { status: 400 });
  }

  if (email && typeof email !== 'string') {
    return NextResponse.json({ error: 'Email must be a string' }, { status: 400 });
  }

  let user;
  try {
    user = await createAccount(
      label.trim(),
      (role as 'customer' | 'admin') ?? 'customer',
      email as string | undefined,
    );
  } catch (err: unknown) {
    console.error('[admin/accounts] Failed to create account:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }

  await query(
    `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
     VALUES ($1, 'account_created', 'user', $2, $3)`,
    [session.user.id, user.id, JSON.stringify({ label: user.label, role: user.role })],
  );

  return NextResponse.json({
    id: user.id,
    label: user.label,
    accessCode: user.access_code,
    role: user.role,
  }, { status: 201 });
}

export async function PATCH(request: Request) {
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

  const { userId, action } = body as Record<string, unknown>;

  if (!userId || typeof userId !== 'string' || !action || typeof action !== 'string') {
    return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 });
  }

  switch (action) {
    case 'toggle_enabled': {
      await query('UPDATE users SET enabled = NOT enabled, updated_at = now() WHERE id = $1', [userId]);
      await query(
        `INSERT INTO audit_log (actor_id, action, target_type, target_id)
         VALUES ($1, 'toggle_account', 'user', $2)`,
        [session.user.id, userId],
      );
      return NextResponse.json({ success: true });
    }

    case 'regenerate_code': {
      const newCode = await regenerateAccessCode(userId);
      if (!newCode) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      await query(
        `INSERT INTO audit_log (actor_id, action, target_type, target_id)
         VALUES ($1, 'regenerate_access_code', 'user', $2)`,
        [session.user.id, userId],
      );
      return NextResponse.json({ accessCode: newCode });
    }

    case 'unlink_wallet': {
      await query('DELETE FROM wallet_links WHERE user_id = $1', [userId]);
      await query(
        `INSERT INTO audit_log (actor_id, action, target_type, target_id)
         VALUES ($1, 'unlink_wallet', 'user', $2)`,
        [session.user.id, userId],
      );
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
