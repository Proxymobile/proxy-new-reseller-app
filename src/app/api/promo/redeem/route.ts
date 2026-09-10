import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { redeemPromoCode, extractIp } from '@/lib/promo';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { code } = body as Record<string, unknown>;
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'code is required' }, { status: 400 });
  }

  const result = await redeemPromoCode(session.user.id, code, extractIp(request));

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ creditedUsd: result.creditedUsd, grantedGb: result.grantedGb });
}
