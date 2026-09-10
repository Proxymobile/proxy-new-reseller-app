import { NextResponse } from 'next/server';
import { createAccount } from '@/lib/auth';
import { query } from '@/lib/db';
import { redeemPromoCode, extractIp } from '@/lib/promo';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { label, promoCode } = body as Record<string, unknown>;

  const accountLabel =
    typeof label === 'string' && label.trim().length > 0
      ? label.trim().slice(0, 50)
      : `user-${Date.now().toString(36)}`;

  try {
    const user = await createAccount(accountLabel, 'customer');
    if (!user) {
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    await query(
      `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
       VALUES ($1, 'self_signup', 'user', $2, $3)`,
      [user.id, user.id, JSON.stringify({ label: accountLabel })],
    );

    // Optional promo code — a bad code never blocks signup
    let promo: { creditedUsd?: number; grantedGb?: number; error?: string } | undefined;
    if (typeof promoCode === 'string' && promoCode.trim()) {
      try {
        const result = await redeemPromoCode(user.id, promoCode, extractIp(request));
        promo = result.ok
          ? { creditedUsd: result.creditedUsd, grantedGb: result.grantedGb }
          : { error: result.error };
      } catch (err) {
        console.error('[auth/signup] Promo redemption failed:', err);
        promo = { error: 'Promo redemption failed' };
      }
    }

    return NextResponse.json(
      { accessCode: user.access_code, label: user.label, promo },
      { status: 201 },
    );
  } catch (err: unknown) {
    console.error('[auth/signup] Failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
