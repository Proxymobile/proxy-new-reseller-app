import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getProxyUsername } from '@/lib/proxies';
import { getCountryInventory } from '@/lib/inventory';
import { queryOne } from '@/lib/db';
import { buildCredentials, isNetwork, isRotation, newSessionId, sanitizeSessionId, stockFor } from '@/lib/routing';

interface Customer {
  pak_key: string | null;
}

/**
 * Server-side proxy credential builder (for API/scripted use; the dashboard
 * builds the same strings client-side via the shared `@/lib/routing`).
 *
 * Body: { country: "us", network?: "mobile"|"modem"|"residential", rotation?: RotationMode,
 *         protocol?: "http"|"socks5", sessionId?: string }
 */
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

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { country, network = 'mobile', rotation = 'sticky', protocol = 'http', sessionId } = body;

  if (typeof country !== 'string' || !/^[a-z]{2}$/i.test(country)) {
    return NextResponse.json({ error: 'country must be a 2-letter ISO code' }, { status: 400 });
  }
  if (!isNetwork(network)) {
    return NextResponse.json({ error: 'network must be "mobile", "modem" or "residential"' }, { status: 400 });
  }
  if (!isRotation(rotation)) {
    return NextResponse.json({ error: 'Invalid rotation' }, { status: 400 });
  }
  if (protocol !== 'http' && protocol !== 'socks5') {
    return NextResponse.json({ error: 'protocol must be "http" or "socks5"' }, { status: 400 });
  }
  const sid = (typeof sessionId === 'string' && sanitizeSessionId(sessionId)) || newSessionId();

  // Reject countries with no live stock for the chosen network, so a customer
  // never gets a string that 502s at the gateway. If the stock lookup itself
  // fails, don't hard-block — the gateway is the final authority.
  const inv = await getCountryInventory(country);
  const cc = country.toLowerCase();
  if (inv) {
    if (stockFor(network, inv) <= 0) {
      return NextResponse.json(
        { error: `No ${network} IPs are online in "${cc.toUpperCase()}" right now` },
        { status: 409 },
      );
    }
  }

  try {
    const creds = buildCredentials({
      proxyUsername: getProxyUsername(),
      pakKey: customer.pak_key,
      network,
      country: cc,
      rotation,
      protocol,
      sid,
    });
    return NextResponse.json({ proxyUrl: creds.url, ...creds });
  } catch (err: unknown) {
    console.error('[pool/proxy-url] Failed to build proxy URL:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to generate proxy URL' }, { status: 500 });
  }
}
