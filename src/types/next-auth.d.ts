import 'next-auth';

declare module 'next-auth' {
  interface User {
    role?: string;
    label?: string;
    walletRequired?: boolean;
    walletChain?: string | null;
  }

  interface Session {
    user: User & {
      id: string;
      role?: string;
      label?: string;
      walletRequired?: boolean;
      walletChain?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    label?: string;
    walletRequired?: boolean;
    walletChain?: string | null;
  }
}
