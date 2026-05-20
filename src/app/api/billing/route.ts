import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(100, Number(url.searchParams.get('limit') ?? 50));
  const offset = Math.max(0, Number(url.searchParams.get('offset') ?? 0));

  const transactions = await query(
    `SELECT id, amount_usd, type, reason, reference, payment_method, invoice_number, created_at
     FROM balance_transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [session.user.id, limit, offset],
  );

  const stats = await queryOne<{
    total_deposits: string;
    total_purchases: string;
    tx_count: string;
  }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'credit' THEN amount_usd ELSE 0 END), 0) AS total_deposits,
       COALESCE(SUM(CASE WHEN type = 'debit' THEN amount_usd ELSE 0 END), 0) AS total_purchases,
       COUNT(*) AS tx_count
     FROM balance_transactions
     WHERE user_id = $1`,
    [session.user.id],
  );

  const balance = await queryOne<{ balance_usd: string }>(
    'SELECT balance_usd FROM users WHERE id = $1',
    [session.user.id],
  );

  return NextResponse.json({
    transactions,
    stats: {
      totalDeposits: Number(stats?.total_deposits ?? 0),
      totalPurchases: Number(stats?.total_purchases ?? 0),
      txCount: Number(stats?.tx_count ?? 0),
      balance: Number(balance?.balance_usd ?? 0),
    },
  });
}
