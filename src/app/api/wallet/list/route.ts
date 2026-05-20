import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const wallets = await query<{ chain: string; address: string; verified: boolean }>(
    'SELECT chain, address, verified FROM wallet_links WHERE user_id = $1 ORDER BY linked_at DESC',
    [session.user.id],
  );

  return NextResponse.json({ wallets });
}
