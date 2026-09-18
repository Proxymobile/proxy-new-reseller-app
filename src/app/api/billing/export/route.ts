import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

/** CSV of the signed-in customer's own transactions. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  const rows = await query<Record<string, string>>(
    `SELECT created_at, invoice_number, reason, payment_method, type, amount_usd
     FROM balance_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5000`,
    [session.user.id],
  );
  const esc = (v: unknown) => {
    if (typeof v === 'number') return Number.isFinite(v) ? v.toFixed(2) : '';
    const s = v == null ? '' : String(v);
    // Neutralise spreadsheet formulas and quote every field.
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const lines = [
    ['date', 'invoice', 'description', 'method', 'type', 'amount_usd'].join(','),
    ...rows.map((r) => [
      new Date(r.created_at).toISOString(), r.invoice_number, r.reason, r.payment_method, r.type,
      (r.type === 'debit' ? -1 : 1) * Number(r.amount_usd),
    ].map(esc).join(',')),
  ];
  return new Response(lines.join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="proxymobile-transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
