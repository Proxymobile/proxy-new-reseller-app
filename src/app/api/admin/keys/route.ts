import { NextResponse } from 'next/server';
import { auth, isAdmin } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { proxies } from '@/lib/proxies';

const MIN_GB = 1;
const MAX_GB = 1000;
const MIN_DAYS = 1;
const MAX_DAYS = 365;

// POST /api/admin/keys
// Mints a fresh proxy key bound to the admin's OWN account ("a key for my use").
// Because customers.user_id is UNIQUE (one key per user), calling this again
// replaces the admin's existing key with a new one.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const adminId = session.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { gb: gbIn, days: daysIn, label: labelIn } = body as Record<string, unknown>;

  const gb = Math.round(Number(gbIn));
  if (!Number.isFinite(gb) || gb < MIN_GB || gb > MAX_GB) {
    return NextResponse.json({ error: `gb must be between ${MIN_GB} and ${MAX_GB}` }, { status: 400 });
  }
  const days = Math.round(Number(daysIn));
  if (!Number.isFinite(days) || days < MIN_DAYS || days > MAX_DAYS) {
    return NextResponse.json({ error: `days must be between ${MIN_DAYS} and ${MAX_DAYS}` }, { status: 400 });
  }
  const label =
    typeof labelIn === 'string' && labelIn.trim().length > 0
      ? labelIn.trim().slice(0, 50)
      : 'admin-self';

  // Ensure the admin has a customers row (admin accounts don't get one by default).
  let customer = await queryOne<{ id: string; pak_key_id: string | null }>(
    'SELECT id, pak_key_id FROM customers WHERE user_id = $1',
    [adminId],
  );
  if (!customer) {
    customer = await queryOne<{ id: string; pak_key_id: string | null }>(
      `INSERT INTO customers (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
       RETURNING id, pak_key_id`,
      [adminId],
    );
  }
  if (!customer) {
    return NextResponse.json({ error: 'Failed to initialize customer record' }, { status: 500 });
  }

  const expiresAt = new Date(Date.now() + days * 86_400_000).toISOString();

  let key: { id: string; key: string };
  try {
    key = await proxies().poolKeys.create({
      label: `admin:${label}`,
      trafficCapGB: gb,
      expiresAt,
    });
  } catch (err: unknown) {
    console.error('[admin/keys] Provider error minting key:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'Provider error — could not mint key. Check PROXIES_SX_API_KEY.' },
      { status: 502 },
    );
  }

  await query(
    `UPDATE customers
       SET pak_key_id = $1, pak_key = $2, traffic_cap_gb = $3,
           traffic_used_gb = 0, expires_at = $4, plan_id = $5, updated_at = now()
     WHERE id = $6`,
    [key.id, key.key, gb, expiresAt, `admin-${gb}gb`, customer.id],
  );

  await query(
    `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
     VALUES ($1, 'admin_create_key', 'customer', $2, $3)`,
    [adminId, customer.id, JSON.stringify({ gb, days, keyId: key.id, label, replaced: !!customer.pak_key_id })],
  );

  // Build a ready-to-use proxy URL (US, sticky) for convenience.
  let proxyUrl: string | null = null;
  try {
    // Gateway splits the username on '-', so the sid must be [a-z0-9_]; the
    // admin id is a UUID (contains hyphens) — sanitize to a stable safe sid.
    const safeSid = 'u' + adminId.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 48);
    proxyUrl = proxies().buildProxyUrl(key.key, { country: 'us', rotation: 'sticky', sid: safeSid });
  } catch {
    proxyUrl = null;
  }

  return NextResponse.json({
    success: true,
    replaced: !!customer.pak_key_id,
    key: { id: key.id, key: key.key, gb, expiresAt, proxyUrl },
  });
}
