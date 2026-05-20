import { NextResponse } from 'next/server';
import { auth, isAdmin } from '@/lib/auth';
import { query, queryOne, nextInvoiceNumber } from '@/lib/db';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { userId, amount, reason, type } = body as Record<string, unknown>;

  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
  }
  if (amount > 10000) {
    return NextResponse.json({ error: 'amount cannot exceed $10,000' }, { status: 400 });
  }

  const txType = type === 'debit' ? 'debit' : 'credit';

  const user = await queryOne<{ id: string; balance_usd: string }>(
    'SELECT id, balance_usd FROM users WHERE id = $1',
    [userId],
  );
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // For debit, check sufficient balance
  if (txType === 'debit' && Number(user.balance_usd) < amount) {
    return NextResponse.json({
      error: `Insufficient balance. User has $${Number(user.balance_usd).toFixed(2)}`,
    }, { status: 400 });
  }

  const dbAmount = txType === 'debit' ? -amount : amount;

  await query(
    'UPDATE users SET balance_usd = balance_usd + $1, updated_at = now() WHERE id = $2',
    [dbAmount, userId],
  );

  const defaultReason = txType === 'debit' ? 'Manual debit by admin' : 'Manual top-up by admin';

  const invoiceNumber = await nextInvoiceNumber();

  await query(
    `INSERT INTO balance_transactions (user_id, amount_usd, type, reason, created_by, payment_method, invoice_number)
     VALUES ($1, $2, $3, $4, $5, 'admin', $6)`,
    [userId, amount, txType, (reason as string) || defaultReason, session.user.id, invoiceNumber],
  );

  await query(
    `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
     VALUES ($1, $2, 'user', $3, $4)`,
    [
      session.user.id,
      txType === 'debit' ? 'balance_debit' : 'balance_credit',
      userId,
      JSON.stringify({ amount, type: txType, reason: (reason as string) || defaultReason }),
    ],
  );

  const updated = await queryOne<{ balance_usd: string }>(
    'SELECT balance_usd FROM users WHERE id = $1',
    [userId],
  );

  return NextResponse.json({
    success: true,
    balance: Number(updated?.balance_usd ?? 0),
  });
}
