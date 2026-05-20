import { NextResponse } from 'next/server';
import { auth, isAdmin } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Math.min(200, Number(url.searchParams.get('limit') ?? 100));
  const offset = Math.max(0, Number(url.searchParams.get('offset') ?? 0));
  const method = url.searchParams.get('method');
  const type = url.searchParams.get('type');

  let where = '';
  const params: unknown[] = [];
  let paramIdx = 1;

  if (method) {
    where += ` AND bt.payment_method = $${paramIdx++}`;
    params.push(method);
  }
  if (type === 'credit' || type === 'debit') {
    where += ` AND bt.type = $${paramIdx++}`;
    params.push(type);
  }

  const transactions = await query(
    `SELECT bt.id, bt.user_id, bt.amount_usd, bt.type, bt.reason, bt.reference,
            bt.payment_method, bt.invoice_number, bt.created_at,
            u.label AS user_label, u.email AS user_email,
            cb.label AS created_by_label
     FROM balance_transactions bt
     JOIN users u ON u.id = bt.user_id
     LEFT JOIN users cb ON cb.id = bt.created_by
     WHERE 1=1 ${where}
     ORDER BY bt.created_at DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
    [...params, limit, offset],
  );

  const stats = await queryOne<{
    total_deposits: string;
    total_purchases: string;
    stripe_deposits: string;
    admin_credits: string;
    tx_count: string;
    unique_users: string;
  }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'credit' THEN amount_usd ELSE 0 END), 0) AS total_deposits,
       COALESCE(SUM(CASE WHEN type = 'debit' THEN amount_usd ELSE 0 END), 0) AS total_purchases,
       COALESCE(SUM(CASE WHEN type = 'credit' AND payment_method = 'stripe' THEN amount_usd ELSE 0 END), 0) AS stripe_deposits,
       COALESCE(SUM(CASE WHEN type = 'credit' AND payment_method = 'admin' THEN amount_usd ELSE 0 END), 0) AS admin_credits,
       COUNT(*) AS tx_count,
       COUNT(DISTINCT user_id) AS unique_users
     FROM balance_transactions`,
    [],
  );

  return NextResponse.json({
    transactions,
    stats: {
      totalDeposits: Number(stats?.total_deposits ?? 0),
      totalPurchases: Number(stats?.total_purchases ?? 0),
      stripeDeposits: Number(stats?.stripe_deposits ?? 0),
      adminCredits: Number(stats?.admin_credits ?? 0),
      txCount: Number(stats?.tx_count ?? 0),
      uniqueUsers: Number(stats?.unique_users ?? 0),
    },
  });
}
