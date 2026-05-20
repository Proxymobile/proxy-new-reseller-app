import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { proxies } from '@/lib/proxies';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stock = await proxies().pool.getStock();
    return NextResponse.json(stock);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[pool/stock] Failed to fetch stock:', message);
    return NextResponse.json(
      { error: 'Failed to fetch pool status' },
      { status: 502 },
    );
  }
}
