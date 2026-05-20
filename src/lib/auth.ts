import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { timingSafeEqual, randomBytes, createHash } from 'crypto';
import { queryOne, query } from '@/lib/db';
import { authConfig } from '@/lib/auth.config';
import { verifyLoginChallenge, buildLoginMessage, verifyEthSignature } from '@/lib/wallet';

export interface DbUser {
  id: string;
  label: string;
  email: string | null;
  access_code: string;
  role: string;
  enabled: boolean;
}

interface WalletLink {
  chain: string;
  address: string;
  verified: boolean;
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex').slice(0, 16);
}

async function checkRateLimit(accessCode: string): Promise<boolean> {
  const codeHash = hashCode(accessCode);
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM login_attempts
     WHERE access_code_hash = $1
     AND success = false
     AND attempted_at > now() - interval '15 minutes'`,
    [codeHash],
  );
  return Number(result?.count ?? 0) < 5;
}

async function recordAttempt(accessCode: string, success: boolean) {
  const codeHash = hashCode(accessCode);
  await query(
    'INSERT INTO login_attempts (access_code_hash, success) VALUES ($1, $2)',
    [codeHash, success],
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      id: 'access-code',
      name: 'Access Code',
      credentials: {
        accessCode: { label: 'Access Code', type: 'text' },
      },
      async authorize(credentials) {
        const accessCode = (credentials?.accessCode as string | undefined)?.trim();
        if (!accessCode) return null;

        const allowed = await checkRateLimit(accessCode);
        if (!allowed) return null;

        const user = await queryOne<DbUser>(
          'SELECT id, label, email, access_code, role, enabled FROM users WHERE access_code = $1',
          [accessCode],
        );

        if (!user || !user.enabled) {
          await recordAttempt(accessCode, false);
          return null;
        }

        if (!safeCompare(user.access_code, accessCode)) {
          await recordAttempt(accessCode, false);
          return null;
        }

        await recordAttempt(accessCode, true);

        // Clean up old login attempts (older than 24h)
        await query(
          "DELETE FROM login_attempts WHERE attempted_at < now() - interval '24 hours'",
          [],
        ).catch(() => {});

        // Check if wallet 2FA is linked (informational — stored in session)
        const wallet = await queryOne<WalletLink>(
          'SELECT chain, address, verified FROM wallet_links WHERE user_id = $1 AND verified = true LIMIT 1',
          [user.id],
        );

        return {
          id: user.id,
          name: user.label,
          email: user.email,
          role: user.role,
          label: user.label,
          walletRequired: !!wallet,
          walletChain: wallet?.chain ?? null,
        };
      },
    }),
    Credentials({
      id: 'admin-password',
      name: 'Admin Password',
      credentials: {
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const password = (credentials?.password as string | undefined)?.trim();
        if (!password) return null;

        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminPassword) return null;

        // Timing-safe comparison
        if (password.length !== adminPassword.length) return null;
        if (!timingSafeEqual(Buffer.from(password), Buffer.from(adminPassword))) return null;

        // Find the first admin user
        const admin = await queryOne<DbUser>(
          "SELECT id, label, email, access_code, role, enabled FROM users WHERE role = 'admin' AND enabled = true LIMIT 1",
          [],
        );
        if (!admin) return null;

        return {
          id: admin.id,
          name: admin.label,
          email: admin.email,
          role: admin.role,
          label: admin.label,
          walletRequired: false,
          walletChain: null,
        };
      },
    }),
    Credentials({
      id: 'wallet',
      name: 'Wallet',
      credentials: {
        address: { label: 'Address', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
        nonce: { label: 'Nonce', type: 'text' },
        hmac: { label: 'HMAC', type: 'text' },
      },
      async authorize(credentials) {
        const address = (credentials?.address as string | undefined)?.trim();
        const signature = (credentials?.signature as string | undefined)?.trim();
        const nonce = (credentials?.nonce as string | undefined)?.trim();
        const hmac = (credentials?.hmac as string | undefined)?.trim();

        if (!address || !signature || !nonce || !hmac) return null;

        // Verify HMAC (proves challenge is authentic and fresh)
        if (!verifyLoginChallenge(nonce, hmac, address)) return null;

        // Verify ETH signature
        const message = buildLoginMessage(address, nonce);
        const valid = await verifyEthSignature(message, signature, address);
        if (!valid) return null;

        // Look up linked wallet
        const wallet = await queryOne<{ user_id: string }>(
          'SELECT user_id FROM wallet_links WHERE chain = $1 AND address = $2 AND verified = true',
          ['ethereum', address.toLowerCase()],
        );
        if (!wallet) return null;

        // Get user
        const user = await queryOne<DbUser>(
          'SELECT id, label, email, access_code, role, enabled FROM users WHERE id = $1',
          [wallet.user_id],
        );
        if (!user || !user.enabled) return null;

        return {
          id: user.id,
          name: user.label,
          email: user.email,
          role: user.role,
          label: user.label,
          walletRequired: false,
          walletChain: 'ethereum',
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as Record<string, unknown>).role as string;
        token.label = (user as Record<string, unknown>).label as string;
        token.walletRequired = (user as Record<string, unknown>).walletRequired as boolean;
        token.walletChain = (user as Record<string, unknown>).walletChain as string | null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string | undefined;
        session.user.label = token.label as string | undefined;
        session.user.walletRequired = token.walletRequired as boolean | undefined;
        session.user.walletChain = token.walletChain as string | null | undefined;
      }
      return session;
    },
  },
});

export function generateAccessCode(): string {
  const raw = randomBytes(8).toString('hex');
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
}

export async function createAccount(label: string, role: 'customer' | 'admin' = 'customer', email?: string) {
  const accessCode = generateAccessCode();

  const user = await queryOne<DbUser>(
    `INSERT INTO users (label, email, access_code, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, label, email, access_code, role, enabled`,
    [label, email ?? null, accessCode, role],
  );

  if (!user) return null;

  if (role === 'customer') {
    await query(
      'INSERT INTO customers (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
      [user.id],
    );
  }

  return user;
}

export async function regenerateAccessCode(userId: string): Promise<string | null> {
  const accessCode = generateAccessCode();
  const result = await queryOne<{ access_code: string }>(
    'UPDATE users SET access_code = $1, updated_at = now() WHERE id = $2 RETURNING access_code',
    [accessCode, userId],
  );
  return result?.access_code ?? null;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const user = await queryOne<{ role: string }>('SELECT role FROM users WHERE id = $1', [userId]);
  return user?.role === 'admin';
}
