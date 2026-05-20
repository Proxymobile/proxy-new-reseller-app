import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import { buildLinkMessage, verifyEthSignature } from '@/lib/wallet';

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

  const { nonce, signature, address } = body as Record<string, unknown>;

  if (!nonce || typeof nonce !== 'string') {
    return NextResponse.json({ error: 'Nonce required' }, { status: 400 });
  }
  if (!signature || typeof signature !== 'string') {
    return NextResponse.json({ error: 'Signature required' }, { status: 400 });
  }
  if (!address || typeof address !== 'string') {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  // Find the challenge
  const challenge = await queryOne<{
    id: string;
    user_id: string;
    chain: string;
    address: string;
    used: boolean;
    expires_at: string;
  }>(
    `SELECT id, user_id, chain, address, used, expires_at
     FROM wallet_challenges
     WHERE nonce = $1 AND user_id = $2`,
    [nonce, session.user.id],
  );

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
  }
  if (challenge.used) {
    return NextResponse.json({ error: 'Challenge already used' }, { status: 410 });
  }
  if (new Date(challenge.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Challenge expired' }, { status: 410 });
  }
  if (challenge.address.toLowerCase() !== address.toLowerCase()) {
    return NextResponse.json({ error: 'Address mismatch' }, { status: 400 });
  }

  // Mark challenge as used
  await query('UPDATE wallet_challenges SET used = true WHERE id = $1', [challenge.id]);

  // Verify ETH signature cryptographically
  if (challenge.chain === 'ethereum') {
    const message = buildLinkMessage(challenge.chain, nonce);
    const valid = await verifyEthSignature(message, signature, address);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  }

  // Upsert wallet link (store address lowercase for consistent lookups)
  await query(
    `INSERT INTO wallet_links (user_id, chain, address, verified)
     VALUES ($1, $2, $3, true)
     ON CONFLICT (chain, address) DO UPDATE SET verified = true, linked_at = now()`,
    [session.user.id, challenge.chain, address.toLowerCase()],
  );

  await query(
    `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
     VALUES ($1, 'wallet_linked', 'user', $2, $3)`,
    [session.user.id, session.user.id, JSON.stringify({ chain: challenge.chain, address: address.toLowerCase() })],
  );

  return NextResponse.json({ success: true, chain: challenge.chain, address: address.toLowerCase() });
}
