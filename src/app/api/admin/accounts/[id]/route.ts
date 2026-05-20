import { NextResponse } from 'next/server';
import { auth, isAdmin } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const user = await queryOne(`
    SELECT
      u.id, u.label, u.email, u.role, u.enabled, u.balance_usd,
      u.created_at, u.updated_at,
      c.id AS customer_id, c.pak_key_id, c.pak_key,
      c.traffic_cap_gb, c.traffic_used_gb,
      c.plan_id, c.expires_at
    FROM users u
    LEFT JOIN customers c ON c.user_id = u.id
    WHERE u.id = $1
  `, [id]);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const wallets = await query(
    'SELECT chain, address, verified, linked_at FROM wallet_links WHERE user_id = $1 ORDER BY linked_at DESC',
    [id],
  );

  const transactions = await query(
    `SELECT bt.id, bt.amount_usd, bt.type, bt.reason, bt.reference, bt.created_at,
            u.label AS created_by_label
     FROM balance_transactions bt
     LEFT JOIN users u ON u.id = bt.created_by
     WHERE bt.user_id = $1
     ORDER BY bt.created_at DESC
     LIMIT 50`,
    [id],
  );

  const purchases = await query(
    `SELECT p.id, p.plan_id, p.gb_amount, p.price_usd, p.status, p.created_at,
            p.stripe_session_id
     FROM purchases p
     JOIN customers c ON c.id = p.customer_id
     WHERE c.user_id = $1
     ORDER BY p.created_at DESC
     LIMIT 50`,
    [id],
  );

  return NextResponse.json({ user, wallets, transactions, purchases });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { label, email, role } = body as Record<string, unknown>;

  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (label !== undefined) {
    if (typeof label !== 'string' || label.trim().length === 0) {
      return NextResponse.json({ error: 'Label cannot be empty' }, { status: 400 });
    }
    updates.push(`label = $${paramIdx++}`);
    values.push(label.trim());
  }

  if (email !== undefined) {
    if (email !== null && typeof email !== 'string') {
      return NextResponse.json({ error: 'Email must be a string or null' }, { status: 400 });
    }
    updates.push(`email = $${paramIdx++}`);
    values.push(email === '' ? null : email);
  }

  if (role !== undefined) {
    if (role !== 'customer' && role !== 'admin') {
      return NextResponse.json({ error: 'Role must be customer or admin' }, { status: 400 });
    }
    updates.push(`role = $${paramIdx++}`);
    values.push(role);
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  updates.push(`updated_at = now()`);
  values.push(id);

  await query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIdx}`,
    values,
  );

  await query(
    `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
     VALUES ($1, 'user_updated', 'user', $2, $3)`,
    [session.user.id, id, JSON.stringify({ label, email, role })],
  );

  return NextResponse.json({ success: true });
}
