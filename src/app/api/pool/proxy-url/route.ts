import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { proxies } from '@/lib/proxies';
import { queryOne } from '@/lib/db';
import { config } from '@/config';

interface Customer {
  pak_key: string | null;
}

const VALID_ROTATIONS = ['sticky', 'auto10', 'auto30', 'hard', 'none'] as const;

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

  const { country, rotation } = body as Record<string, unknown>;

  const validCountries = config.countries as readonly string[];
  if (country && (typeof country !== 'string' || !validCountries.includes(country))) {
    return NextResponse.json({ error: 'Invalid country' }, { status: 400 });
  }

  if (rotation && (typeof rotation !== 'string' || !(VALID_ROTATIONS as readonly string[]).includes(rotation))) {
    return NextResponse.json({ error: 'Invalid rotation' }, { status: 400 });
  }

  try {
    const url = proxies().buildProxyUrl(customer.pak_key, {
      country: (country as string) ?? 'us',
      rotation: ((rotation as string) ?? 'sticky') as 'sticky' | 'auto10' | 'auto30' | 'hard' | 'none',
      sid: session.user.id,
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
