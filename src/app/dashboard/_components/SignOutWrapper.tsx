'use client';

import { signOut } from 'next-auth/react';
import { TopBar } from './TopBar';

interface Props {
  userLabel: string;
  userEmail: string | null;
  balance: number;
}

export function TopBarWithSignOut({ userLabel, userEmail, balance }: Props) {
  return (
    <TopBar
      userLabel={userLabel}
      userEmail={userEmail}
      balance={balance}
      onSignOut={() => signOut({ callbackUrl: '/' })}
    />
  );
}
