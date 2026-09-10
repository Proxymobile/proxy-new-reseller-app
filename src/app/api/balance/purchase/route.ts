import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne, nextInvoiceNumber } from '@/lib/db';
import { getPlan } from '@/config';
import { provisionTraffic } from '@/lib/provision';
import {
  customGbPrice,
  CUSTOM_DURATION_DAYS,
  CUSTOM_MIN_GB,
  CUSTOM_MAX_GB,
} from '@/lib/pricing';

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

  const { planId, gb: gbInput } = body as Record<string, unknown>;

  // ─── Resolve to a uniform { gb, priceUsd, durationDays, label, planRef } shape
  let gb: number;
  let priceUsd: number;
  let durationDays: number;
  let label: string;
  let planRef: string; // used for purchase.plan_id reference

  if (planId && typeof planId === 'string') {
    const plan = getPlan(planId);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    gb = plan.gb;
    priceUsd = plan.priceUsd;
    durationDays = plan.durationDays;
    label = plan.displayName;
    planRef = planId;
  } else if (typeof gbInput === 'number' && Number.isFinite(gbInput)) {
    const gbVal = Math.round(gbInput);
    if (gbVal < CUSTOM_MIN_GB || gbVal > CUSTOM_MAX_GB) {
      return NextResponse.json({
        error: `gb must be between ${CUSTOM_MIN_GB} and ${CUSTOM_MAX_GB}`,
      }, { status: 400 });
    }
    gb = gbVal;
    // SERVER-AUTHORITATIVE price calc — never trust client price
    priceUsd = customGbPrice(gbVal);
    durationDays = CUSTOM_DURATION_DAYS;
    label = `Custom (${gbVal} GB)`;
    planRef = `custom-${gbVal}gb`;
  } else {
    return NextResponse.json({
      error: 'Provide planId or gb (number, 1-100)',
    }, { status: 400 });
  }

  // ─── ATOMIC DEBIT ───
  // Single conditional UPDATE: Postgres row-locks the user row, so two
  // concurrent purchases can't both pass a balance check and overspend.
  // Returns no row if the user is missing OR the balance is insufficient.
  const debited = await queryOne<{ balance_usd: string }>(
    `UPDATE users SET balance_usd = balance_usd - $1, updated_at = now()
     WHERE id = $2 AND balance_usd >= $1
     RETURNING balance_usd`,
    [priceUsd, session.user.id],
  );
  if (!debited) {
    const cur = await queryOne<{ balance_usd: string }>(
      'SELECT balance_usd FROM users WHERE id = $1',
      [session.user.id],
    );
    if (!cur) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({
      error: `Insufficient balance. Need $${priceUsd.toFixed(2)}, have $${Number(cur.balance_usd).toFixed(2)}`,
    }, { status: 402 });
  }

  const invoiceNumber = await nextInvoiceNumber();

  await query(
    `INSERT INTO balance_transactions (user_id, amount_usd, type, reason, reference, payment_method, invoice_number)
     VALUES ($1, $2, 'debit', $3, $4, 'balance', $5)`,
    [session.user.id, priceUsd, `Purchase: ${label} (${gb} GB)`, planRef, invoiceNumber],
  );

  let customerId: string;
  try {
    const result = await provisionTraffic(session.user.id, gb, durationDays, `invoice-${invoiceNumber}`);
    customerId = result.customerId;
  } catch (err: unknown) {
    // Refund balance on provider failure
    await query(
      'UPDATE users SET balance_usd = balance_usd + $1, updated_at = now() WHERE id = $2',
      [priceUsd, session.user.id],
    );
    const refundInvoice = await nextInvoiceNumber();
    await query(
      `INSERT INTO balance_transactions (user_id, amount_usd, type, reason, reference, payment_method, invoice_number)
       VALUES ($1, $2, 'credit', 'Refund: provider error', $3, 'system', $4)`,
      [session.user.id, priceUsd, planRef, refundInvoice],
    );
    console.error('[balance/purchase] Provider error, refunded:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Provider error — balance refunded' }, { status: 502 });
  }

  await query(
    `INSERT INTO purchases (customer_id, plan_id, gb_amount, price_usd, status)
     VALUES ($1, $2, $3, $4, 'completed')`,
    [customerId, planRef, gb, priceUsd],
  );

  await query(
    `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
     VALUES ($1, 'balance_purchase', 'customer', $2, $3)`,
    [session.user.id, customerId, JSON.stringify({ planRef, gb, price: priceUsd })],
  );

  const updated = await queryOne<{ balance_usd: string }>(
    'SELECT balance_usd FROM users WHERE id = $1',
    [session.user.id],
  );

  return NextResponse.json({
    success: true,
    balance: Number(updated?.balance_usd ?? 0),
    purchased: { gb, priceUsd, label },
  });
}
