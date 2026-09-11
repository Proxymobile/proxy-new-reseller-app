import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { query, queryOne, nextInvoiceNumber } from '@/lib/db';
import { getStripe, webhookSecrets } from '@/lib/stripe';
import { FIRST_TOPUP_BONUS_USD } from '@/lib/pricing';

export async function POST(request: Request) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // Try each configured signing secret so an account switch can keep the old
  // endpoint verifying for a short transition window (see webhookSecrets()).
  const secrets = webhookSecrets();
  if (secrets.length === 0) {
    console.error('[stripe/webhook] No STRIPE_WEBHOOK_SECRET configured — rejecting.');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event | null = null;
  for (const secret of secrets) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, secret);
      break;
    } catch {
      // Try the next secret.
    }
  }
  if (!event) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency: skip already-processed events
  const existing = await queryOne(
    'SELECT id FROM webhook_events WHERE stripe_event_id = $1',
    [event.id],
  );
  if (existing) {
    return NextResponse.json({ received: true });
  }

  try {
    await query(
      'INSERT INTO webhook_events (stripe_event_id, event_type) VALUES ($1, $2)',
      [event.id, event.type],
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;

      if (!userId) {
        return NextResponse.json({ error: 'Missing client_reference_id' }, { status: 400 });
      }

      const amount = Number(session.metadata?.amount ?? (session.amount_total ?? 0) / 100);
      if (amount <= 0) {
        return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
      }

      // Credit user balance
      await query(
        'UPDATE users SET balance_usd = balance_usd + $1, updated_at = now() WHERE id = $2',
        [amount, userId],
      );

      const invoiceNumber = await nextInvoiceNumber();

      await query(
        `INSERT INTO balance_transactions (user_id, amount_usd, type, reason, reference, payment_method, invoice_number)
         VALUES ($1, $2, 'credit', 'Stripe deposit', $3, 'stripe', $4)`,
        [userId, amount, session.id, invoiceNumber],
      );

      await query(
        `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
         VALUES ($1, 'stripe_deposit', 'user', $1, $2)`,
        [userId, JSON.stringify({ amount, stripeSessionId: session.id, invoiceNumber })],
      );

      // ─── First top-up welcome bonus ───
      // The conditional UPDATE claims the bonus and credits it in one statement,
      // so a replayed webhook or two concurrent top-ups can only ever grant it
      // once: whichever transaction wins the row lock leaves the column set, and
      // the loser matches no row.
      const claimed = await queryOne<{ id: string }>(
        `UPDATE users
            SET balance_usd = balance_usd + $1,
                first_topup_bonus_at = now(),
                updated_at = now()
          WHERE id = $2 AND first_topup_bonus_at IS NULL
      RETURNING id`,
        [FIRST_TOPUP_BONUS_USD, userId],
      );

      if (claimed) {
        const bonusInvoice = await nextInvoiceNumber();
        await query(
          `INSERT INTO balance_transactions (user_id, amount_usd, type, reason, reference, payment_method, invoice_number)
           VALUES ($1, $2, 'credit', 'Welcome bonus: first top-up', $3, 'system', $4)`,
          [userId, FIRST_TOPUP_BONUS_USD, session.id, bonusInvoice],
        );
        await query(
          `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
           VALUES ($1, 'first_topup_bonus', 'user', $1, $2)`,
          [userId, JSON.stringify({ amount: FIRST_TOPUP_BONUS_USD, stripeSessionId: session.id, invoiceNumber: bonusInvoice })],
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    await query('DELETE FROM webhook_events WHERE stripe_event_id = $1', [event.id]);
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}
