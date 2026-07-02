import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne, nextInvoiceNumber } from '@/lib/db';
import { getPlan } from '@/config';
import { proxies } from '@/lib/proxies';
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

  const user = await queryOne<{ id: string; balance_usd: string }>(
    'SELECT id, balance_usd FROM users WHERE id = $1',
    [session.user.id],
  );
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const balance = Number(user.balance_usd);
  if (balance < priceUsd) {
    return NextResponse.json({
      error: `Insufficient balance. Need $${priceUsd}, have $${balance.toFixed(2)}`,
    }, { status: 402 });
  }

  // Ensure customer row exists
  let customer = await queryOne<{ id: string; pak_key_id: string | null }>(
    'SELECT id, pak_key_id FROM customers WHERE user_id = $1',
    [session.user.id],
  );
  if (!customer) {
    customer = await queryOne<{ id: string; pak_key_id: string | null }>(
      'INSERT INTO customers (user_id) VALUES ($1) RETURNING id, pak_key_id',
      [session.user.id],
    );
  }
  if (!customer) {
    return NextResponse.json({ error: 'Failed to initialize customer' }, { status: 500 });
  }

  // Debit balance
  await query(
    'UPDATE users SET balance_usd = balance_usd - $1, updated_at = now() WHERE id = $2',
    [priceUsd, session.user.id],
  );

  const invoiceNumber = await nextInvoiceNumber();

  await query(
    `INSERT INTO balance_transactions (user_id, amount_usd, type, reason, reference, payment_method, invoice_number)
     VALUES ($1, $2, 'debit', $3, $4, 'balance', $5)`,
    [session.user.id, priceUsd, `Purchase: ${label} (${gb} GB)`, planRef, invoiceNumber],
  );

  try {
    if (customer.pak_key_id) {
      await proxies().poolKeys.topUp(customer.pak_key_id, {
        addTrafficGB: gb,
        extendDays: durationDays,
      });
      // A key that hit its cap is auto-suspended by the gateway, and topUp does
      // NOT re-enable it — without this the customer pays and the key stays dead.
      await proxies().poolKeys.update(customer.pak_key_id, { enabled: true });
    } else {
      const key = await proxies().poolKeys.create({
        label: `customer:${session.user.id}`,
        trafficCapGB: gb,
        expiresAt: new Date(Date.now() + durationDays * 86_400_000).toISOString(),
      });

      await query(
        'UPDATE customers SET pak_key_id = $1, pak_key = $2, traffic_cap_gb = $3 WHERE id = $4',
        [key.id, key.key, gb, customer.id],
      );
    }
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
    [customer.id, planRef, gb, priceUsd],
  );

  await query(
    `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
     VALUES ($1, 'balance_purchase', 'customer', $2, $3)`,
    [session.user.id, customer.id, JSON.stringify({ planRef, gb, price: priceUsd })],
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
