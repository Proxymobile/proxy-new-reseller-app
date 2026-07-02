import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { proxies } from '@/lib/proxies';
import { queryOne } from '@/lib/db';
import type { RotationMode, Pool } from '@proxies-sx/pool-sdk';

interface Customer {
  pak_key: string | null;
}

const VALID_ROTATIONS: readonly RotationMode[] = ['sticky', 'auto10', 'auto30', 'hard', 'none'];
const VALID_POOLS: readonly Pool[] = ['mbl', 'peer'];

// The gateway lowercases the proxy username and splits it on '-', so the
// session id must match [a-z0-9_] only. User IDs are UUIDs (contain hyphens),
// which would mis-tokenize the sticky session — derive a safe, stable sid.
function safeSid(userId: string): string {
  return 'u' + userId.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 48);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const customer = await queryOne<Customer>(
    'SELECT pak_key FROM customers WHERE user_id = $1',
    [session.user.id],
  );

  if (!customer?.pak_key) {
    return NextResponse.json({ error: 'No active proxy key' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { country, rotation, pool } = body as Record<string, unknown>;

  if (pool !== undefined && !VALID_POOLS.includes(pool as Pool)) {
    return NextResponse.json({ error: 'Invalid pool' }, { status: 400 });
  }
  const poolChoice: Pool = pool === 'peer' ? 'peer' : 'mbl';

  if (rotation !== undefined && (typeof rotation !== 'string' || !(VALID_ROTATIONS as readonly string[]).includes(rotation))) {
    return NextResponse.json({ error: 'Invalid rotation' }, { status: 400 });
  }

  // Validate the country against LIVE pool inventory (not a hardcoded list) so
  // we never advertise/allow a country that has no online endpoints in the
  // selected pool, and never reject a country that genuinely has stock.
  if (country !== undefined && country !== null) {
    if (typeof country !== 'string') {
      return NextResponse.json({ error: 'Invalid country' }, { status: 400 });
    }
    try {
      const stock = await proxies().pool.getStock();
      const available = stock.pools[poolChoice] ?? {};
      if (!(available[country] > 0)) {
        const alternatives = Object.keys(available)
          .filter((c) => available[c] > 0)
          .sort()
          .join(', ');
        return NextResponse.json(
          { error: `No ${poolChoice} endpoints available in "${country}". Try: ${alternatives}` },
          { status: 409 },
        );
      }
    } catch (e) {
      // If the stock lookup fails, don't hard-block — let the gateway validate.
      console.error('[pool/proxy-url] stock check failed:', e instanceof Error ? e.message : e);
    }
  }

  try {
    const url = proxies().buildProxyUrl(customer.pak_key, {
      country: typeof country === 'string' ? country : undefined,
      rotation: ((rotation as string) ?? 'sticky') as RotationMode,
      pool: poolChoice,
      sid: safeSid(session.user.id),
    });

    return NextResponse.json({ proxyUrl: url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[pool/proxy-url] Failed to build proxy URL:', {
      error: message,
      userId: session.user.id,
    });
    return NextResponse.json({ error: 'Failed to generate proxy URL' }, { status: 500 });
  }
}
