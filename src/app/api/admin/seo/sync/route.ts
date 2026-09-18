import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { auth, isAdmin } from '@/lib/auth';
import { syncSearchConsole } from '@/lib/seo-metrics';
import { query } from '@/lib/db';

/** A full sync hits Google three times and writes a few thousand rows. */
export const maxDuration = 60;

/**
 * Lets a scheduler run the sync unattended: `Authorization: Bearer <SEO_CRON_SECRET>`.
 * Absent the env var, only a signed-in admin can trigger a sync.
 */
function hasCronSecret(request: Request): boolean {
  const secret = process.env.SEO_CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization') ?? '';
  const presented = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (presented.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(presented), Buffer.from(secret));
}

export async function POST(request: Request) {
  let actorId: string | null = null;

  if (hasCronSecret(request)) {
    actorId = null; // scheduled run — no human actor
  } else {
    const session = await auth();
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    actorId = session.user.id;
  }

  const url = new URL(request.url);
  const daysParam = Number(url.searchParams.get('days'));
  const days = Number.isFinite(daysParam) && daysParam > 0 ? daysParam : 90;

  const result = await syncSearchConsole({ days, triggeredBy: actorId ?? undefined });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }

  await query(
    `INSERT INTO audit_log (actor_id, action, target_type, metadata)
     VALUES ($1, 'seo_sync', 'seo', $2)`,
    [actorId, JSON.stringify({ rows: result.rowsSynced, days: result.days, scheduled: actorId === null })],
  ).catch(() => {});

  return NextResponse.json(result);
}
