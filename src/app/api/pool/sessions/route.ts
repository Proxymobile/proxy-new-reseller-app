import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { proxies, describeProxiesError } from '@/lib/proxies';
import { queryOne } from '@/lib/db';

/**
 * The signed-in customer's live gateway sessions.
 *
 * Every call is scoped with `{ pakId }` — without it the upstream returns (and
 * lets us close) EVERY customer's sessions under our reseller account.
 * Exit IPs and endpoint ids are deliberately stripped: the kit forbids
 * displaying peer exit IPs anywhere (reputation scrapers harvest them).
 */

async function customerKeyId(userId: string): Promise<string | null> {
  const row = await queryOne<{ pak_key_id: string | null }>(
    'SELECT pak_key_id FROM customers WHERE user_id = $1',
    [userId],
  );
  return row?.pak_key_id ?? null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const pakId = await customerKeyId(session.user.id);
  if (!pakId) {
    return NextResponse.json({ sessions: [], count: 0 });
  }

  try {
    const { sessions } = await proxies().sessions.list({ pakId });
    const visible = sessions
      // Upstream already scopes by pakId; re-check whenever it tells us the owner.
      .filter((s) => !s.isSynthesizedSid && (!s.pakKeyId || s.pakKeyId === pakId))
      .map((s) => ({
        sessionKey: s.sessionKey,
        sessionId: s.sessionId,
        pool: s.pool,
        country: s.country,
        carrier: s.carrier,
        rotation: s.rotation,
        createdAt: s.createdAt,
        lastActivityAt: s.lastActivityAt,
        expiresAt: s.expiresAt,
        requestCount: s.requestCount,
        bytesIn: s.bytesIn,
        bytesOut: s.bytesOut,
      }))
      .sort((a, b) => b.lastActivityAt - a.lastActivityAt);
    return NextResponse.json({ sessions: visible, count: visible.length });
  } catch (err) {
    console.error('[pool/sessions] list failed:', describeProxiesError(err));
    return NextResponse.json({ error: 'Could not load live sessions' }, { status: 502 });
  }
}

/** Body: { sessionKey?: string } — close one session, or all when omitted. */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const pakId = await customerKeyId(session.user.id);
  if (!pakId) {
    return NextResponse.json({ error: 'No active proxy key' }, { status: 404 });
  }

  let sessionKey: unknown;
  try {
    ({ sessionKey } = (await request.json()) as Record<string, unknown>);
  } catch {
    sessionKey = undefined;
  }

  try {
    if (typeof sessionKey === 'string' && sessionKey) {
      const result = await proxies().sessions.close(sessionKey, { pakId });
      return NextResponse.json({ closed: result.success ? 1 : 0 });
    }
    const result = await proxies().sessions.closeAll({ pakId });
    return NextResponse.json({ closed: result.count });
  } catch (err) {
    console.error('[pool/sessions] close failed:', describeProxiesError(err));
    return NextResponse.json({ error: 'Could not close sessions' }, { status: 502 });
  }
}
