import { NextResponse } from 'next/server';
import { auth, isAdmin } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

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

  const { active } = body as Record<string, unknown>;
  if (typeof active !== 'boolean') {
    return NextResponse.json({ error: 'active (boolean) is required' }, { status: 400 });
  }

  const promo = await queryOne(
    'UPDATE promo_codes SET active = $1 WHERE id = $2 RETURNING *',
    [active, id],
  );
  if (!promo) {
    return NextResponse.json({ error: 'Promo code not found' }, { status: 404 });
  }

  await query(
    `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
     VALUES ($1, 'promo_toggle', 'promo_code', $2, $3)`,
    [session.user.id, id, JSON.stringify({ active })],
  );

  return NextResponse.json({ promo });
}
