import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import { buildLinkMessage } from '@/lib/wallet';

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

  const { chain, address } = body as Record<string, unknown>;

  if (!chain || (chain !== 'solana' && chain !== 'ethereum')) {
    return NextResponse.json({ error: 'Chain must be solana or ethereum' }, { status: 400 });
  }

  if (!address || typeof address !== 'string' || address.length < 20) {
    return NextResponse.json({ error: 'Valid wallet address required' }, { status: 400 });
  }

  const normalizedAddress = address.toLowerCase();

  // Check if address already linked to another user
  const existing = await queryOne<{ user_id: string }>(
    'SELECT user_id FROM wallet_links WHERE chain = $1 AND address = $2 AND user_id != $3',
    [chain, normalizedAddress, session.user.id],
  );
  if (existing) {
    return NextResponse.json({ error: 'Wallet already linked to another account' }, { status: 409 });
  }

  // Clean up old challenges for this user
  await query(
    'DELETE FROM wallet_challenges WHERE user_id = $1 AND (used = true OR expires_at < now())',
    [session.user.id],
  );

  // Create new challenge
  const challenge = await queryOne<{ nonce: string }>(
    `INSERT INTO wallet_challenges (user_id, chain, address)
     VALUES ($1, $2, $3)
     RETURNING nonce`,
    [session.user.id, chain, normalizedAddress],
  );

  if (!challenge) {
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
  }

  const message = buildLinkMessage(chain, challenge.nonce);

  return NextResponse.json({
    nonce: challenge.nonce,
    message,
    expiresInSeconds: 300,
  });
}
