import { NextResponse } from 'next/server';
import { auth, isAdmin } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

const CODE_RE = /^[A-Z0-9_-]{3,32}$/;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const promos = await query(`
    SELECT p.*,
           COALESCE(SUM(r.credited_usd), 0)::text AS total_credited
    FROM promo_codes p
    LEFT JOIN promo_redemptions r ON r.promo_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `, []);

  return NextResponse.json({ promos });
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

  const { code, description, creditUsd, maxRedemptions, perIpLimit, newUsersOnly, expiresAt } =
    body as Record<string, unknown>;

  const normalized = typeof code === 'string' ? code.trim().toUpperCase() : '';
  if (!CODE_RE.test(normalized)) {
    return NextResponse.json({ error: 'Code must be 3-32 chars: A-Z, 0-9, _ or -' }, { status: 400 });
  }
  const credit = Number(creditUsd);
  if (!credit || credit <= 0 || credit > 100) {
    return NextResponse.json({ error: 'creditUsd must be between $0.01 and $100' }, { status: 400 });
  }

  const existing = await queryOne('SELECT 1 FROM promo_codes WHERE code = $1', [normalized]);
  if (existing) {
    return NextResponse.json({ error: 'Code already exists' }, { status: 409 });
  }

  const promo = await queryOne(
    `INSERT INTO promo_codes (code, description, credit_usd, max_redemptions, per_ip_limit, new_users_only, expires_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      normalized,
      typeof description === 'string' ? description.slice(0, 200) : null,
      credit,
      maxRedemptions ? Math.max(1, Math.floor(Number(maxRedemptions))) : null,
      perIpLimit !== undefined ? Math.max(0, Math.floor(Number(perIpLimit))) : 1,
      Boolean(newUsersOnly),
      typeof expiresAt === 'string' && expiresAt ? new Date(expiresAt) : null,
      session.user.id,
    ],
  );

  await query(
    `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
     VALUES ($1, 'promo_create', 'promo_code', $2, $3)`,
    [session.user.id, (promo as { id: string }).id, JSON.stringify({ code: normalized, credit })],
  );

  return NextResponse.json({ promo }, { status: 201 });
}
