import { NextResponse } from 'next/server';
import { createLoginChallenge } from '@/lib/wallet';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { address } = body as Record<string, unknown>;

  if (
    !address ||
    typeof address !== 'string' ||
    !address.startsWith('0x') ||
    address.length !== 42
  ) {
    return NextResponse.json({ error: 'Valid Ethereum address required' }, { status: 400 });
  }

  const challenge = createLoginChallenge(address);
  return NextResponse.json(challenge);
}
