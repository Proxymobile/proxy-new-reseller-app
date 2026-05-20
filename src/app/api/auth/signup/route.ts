import { NextResponse } from 'next/server';
import { createAccount } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { label } = body as Record<string, unknown>;

  const accountLabel =
    typeof label === 'string' && label.trim().length > 0
      ? label.trim().slice(0, 50)
      : `user-${Date.now().toString(36)}`;

  try {
    const user = await createAccount(accountLabel, 'customer');
    if (!user) {
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    await query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
       VALUES ($1, 'self_signup', 'user', $2, $3)`,
      [user.id, user.id, JSON.stringify({ label: accountLabel })],
    );

    return NextResponse.json(
      { accessCode: user.access_code, label: user.label },
      { status: 201 },
    );
  } catch (err: unknown) {
    console.error('[auth/signup] Failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
