import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  const stripe = getStripe();
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

  const { amount } = body as Record<string, unknown>;

  if (!amount || typeof amount !== 'number' || amount < 5 || amount > 10000) {
    return NextResponse.json({ error: 'Amount must be between $5 and $10,000' }, { status: 400 });
  }

  const cents = Math.round(amount * 100);

  let checkoutSession;
  try {
    checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: session.user.id,
      metadata: { type: 'deposit', amount: amount.toString() },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Account Deposit — $${amount.toFixed(2)}`,
            },
            unit_amount: cents,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.AUTH_URL}/dashboard/billing?deposit=success`,
      cancel_url: `${process.env.AUTH_URL}/dashboard/billing?deposit=cancelled`,
    });
  } catch (err: unknown) {
    console.error('[stripe/checkout] Failed to create session:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }

  return NextResponse.json({ url: checkoutSession.url });
}
