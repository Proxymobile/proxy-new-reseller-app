import { NextResponse } from 'next/server';
import { auth, isAdmin } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { ensureSeoTables } from '@/lib/seo-metrics';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) return null;
  return session.user.id;
}

export async function GET() {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await ensureSeoTables();
  const keywords = await query(
    'SELECT id, keyword, target_path, priority, notes, created_at FROM seo_keywords ORDER BY keyword ASC',
    [],
  );
  return NextResponse.json({ keywords });
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

  const { keyword, targetPath, priority, notes } = body as Record<string, unknown>;

  if (typeof keyword !== 'string' || keyword.trim().length === 0) {
    return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
  }
  const kw = keyword.trim().slice(0, 120);

  if (priority !== undefined && !['high', 'normal', 'low'].includes(priority as string)) {
    return NextResponse.json({ error: 'Priority must be high, normal or low' }, { status: 400 });
  }

  let path: string | null = null;
  if (typeof targetPath === 'string' && targetPath.trim()) {
    const t = targetPath.trim();
    // Store a root-relative path only — an absolute URL to another host would
    // make the "target page" column misleading.
    if (!t.startsWith('/')) {
      return NextResponse.json({ error: 'Target page must start with /' }, { status: 400 });
    }
    path = t.slice(0, 200);
  }

  await ensureSeoTables();

  const existing = await queryOne<{ id: string }>(
    'SELECT id FROM seo_keywords WHERE lower(keyword) = lower($1)',
    [kw],
  );
  if (existing) {
    return NextResponse.json({ error: 'That keyword is already tracked' }, { status: 409 });
  }

  const row = await queryOne<{ id: string }>(
    `INSERT INTO seo_keywords (keyword, target_path, priority, notes, created_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [kw, path, (priority as string) ?? 'normal', typeof notes === 'string' ? notes.slice(0, 500) : null, adminId],
  );

  await query(
    `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
     VALUES ($1, 'seo_keyword_added', 'seo_keyword', $2, $3)`,
    [adminId, row?.id ?? null, JSON.stringify({ keyword: kw })],
  ).catch(() => {});

  return NextResponse.json({ id: row?.id, keyword: kw }, { status: 201 });
}

export async function DELETE(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await ensureSeoTables();
  const removed = await queryOne<{ keyword: string }>(
    'DELETE FROM seo_keywords WHERE id = $1 RETURNING keyword',
    [id],
  );
  if (!removed) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await query(
    `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
     VALUES ($1, 'seo_keyword_removed', 'seo_keyword', $2, $3)`,
    [adminId, id, JSON.stringify({ keyword: removed.keyword })],
  ).catch(() => {});

  return NextResponse.json({ success: true });
}
