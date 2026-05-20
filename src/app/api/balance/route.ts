import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await queryOne<{ balance_usd: string }>(
    'SELECT balance_usd FROM users WHERE id = $1',
    [session.user.id],
  );

  return NextResponse.json({
    balance: Number(user?.balance_usd ?? 0),
  });
}
