import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { withTransaction } from '@/lib/db';
import { getStripe } from '@/lib/stripe';

/**
 * Stripe → balance credits. Configure the endpoint in Stripe with BOTH events:
 *   checkout.session.completed
 *   checkout.session.async_payment_succeeded
 *
 * Safety rules:
 * - Credit only when `payment_status === 'paid'`. Delayed methods (SEPA, bank
 *   debits) fire `completed` while still unpaid; they are credited later by
 *   `async_payment_succeeded`.
 * - Credit what was actually charged (`amount_total`), never a client value.
 * - One credit per Checkout Session, whichever event delivers it.
 * - Everything, including the processed-event marker, is one transaction: a
 *   crash rolls it all back and Stripe's retry starts clean — never a double credit.
 */
const CREDIT_EVENTS = new Set<string>([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    await withTransaction(async (q) => {
      const fresh = await q(
        `INSERT INTO webhook_events (stripe_event_id, event_type) VALUES ($1, $2)
         ON CONFLICT (stripe_event_id) DO NOTHING RETURNING id`,
        [event.id, event.type],
      );
      if (fresh.length === 0) return; // already processed

      if (!CREDIT_EVENTS.has(event.type)) return;
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status !== 'paid') {
        console.info(`[stripe/webhook] ${session.id} not paid yet (${session.payment_status}) — waiting for async_payment_succeeded`);
        return;
      }
      if (session.metadata?.type && session.metadata.type !== 'deposit') return;

      // Problems a retry can't fix are logged and acknowledged, not 500'd —
      // otherwise Stripe retries for days.
      const userId = session.client_reference_id;
      if (!userId || !UUID_RE.test(userId)) {
        console.error(`[stripe/webhook] ${session.id} has no valid client_reference_id — needs manual review`);
        return;
      }
      const currency = (session.currency ?? 'usd').toLowerCase();
      const amount = (session.amount_total ?? 0) / 100;
      if (currency !== 'usd' || amount <= 0) {
        console.error(`[stripe/webhook] ${session.id} unexpected amount ${amount} ${currency} — needs manual review`);
        return;
      }

      // One credit per Checkout Session (completed + async_payment_succeeded
      // are separate events for the same payment).
      const already = await q(
        `SELECT 1 FROM balance_transactions WHERE reference = $1 AND payment_method = 'stripe' LIMIT 1`,
        [session.id],
      );
      if (already.length > 0) return;

      const credited = await q(
        'UPDATE users SET balance_usd = balance_usd + $1, updated_at = now() WHERE id = $2 RETURNING id',
        [amount, userId],
      );
      if (credited.length === 0) {
        console.error(`[stripe/webhook] ${session.id} paid $${amount} for unknown user ${userId} — needs manual review`);
        return;
      }

      const [{ n }] = await q<{ n: string }>("SELECT nextval('invoice_seq') AS n");
      const invoiceNumber = `INV-${n}`;
      await q(
        `INSERT INTO balance_transactions (user_id, amount_usd, type, reason, reference, payment_method, invoice_number)
         VALUES ($1, $2, 'credit', 'Card deposit', $3, 'stripe', $4)`,
        [userId, amount, session.id, invoiceNumber],
      );
      // actor_id is UUID and target_id is TEXT: pass the id twice. Reusing $1
      // for both makes Postgres fail with "inconsistent types deduced".
      await q(
        `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
         VALUES ($1, 'stripe_deposit', 'user', $2, $3)`,
        [userId, userId, JSON.stringify({ amount, stripeSessionId: session.id, eventId: event.id, invoiceNumber })],
      );
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    // Transaction rolled back (including the processed-event marker), so
    // Stripe's automatic retry will process this event from scratch.
    console.error('[stripe/webhook] handler error:', err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}
