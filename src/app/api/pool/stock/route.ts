import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getInventory } from '@/lib/inventory';

/** Live per-country inventory (mobile / residential counts + carriers). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const inventory = await getInventory();
  if (!inventory) {
    return NextResponse.json({ error: 'Live availability is temporarily unavailable' }, { status: 502 });
  }
  return NextResponse.json(inventory);
}
