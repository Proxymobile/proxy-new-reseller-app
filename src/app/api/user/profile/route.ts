import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { queryOne } from '@/lib/db';

interface UserProfile {
  id: string;
  label: string;
  email: string | null;
  access_code: string;
  role: string;
  created_at: string;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await queryOne<UserProfile>(
    'SELECT id, label, email, access_code, role, created_at FROM users WHERE id = $1',
    [session.user.id],
  );

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}
