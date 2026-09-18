import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { timingSafeEqual, randomBytes, createHash } from 'crypto';
import { queryOne, query } from '@/lib/db';
import { authConfig } from '@/lib/auth.config';
import { verifyLoginChallenge, buildLoginMessage, verifyEthSignature } from '@/lib/wallet';
import { hashPassword, verifyPassword, passwordProblem } from '@/lib/password';

export interface DbUser {
  id: string;
  label: string;
  email: string | null;
  access_code: string;
  role: string;
  enabled: boolean;
  password_hash?: string | null;
  must_change_password?: boolean;
}

interface WalletLink {
  chain: string;
  address: string;
  verified: boolean;
}

/**
 * A real scrypt hash of an unguessable value, used as the comparison target
 * when no account matches. Keeps failed logins constant-time.
 */
const DUMMY_PASSWORD_HASH =
  'scrypt$32768$8$1$' +
  'ZHVtbXlzYWx0Zm9ydGltaW5n$' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

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

        // This is the most privileged credential in the system and the only
        // one that is a single shared secret, so it gets the same brute-force
        // budget as the others. Without this it was the one login path an
        // attacker could hammer without limit. (Retiring this provider in
        // favour of per-admin email+password: see docs/ADMIN-LOGINS.md.)
        if (!(await checkRateLimit('admin-password'))) return null;

        // Timing-safe comparison
        if (password.length !== adminPassword.length || !timingSafeEqual(Buffer.from(password), Buffer.from(adminPassword))) {
          await recordAttempt('admin-password', false);
          return null;
        }
        await recordAttempt('admin-password', true);

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
      id: 'email-password',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        // Rate-limited on the email, reusing the access-code attempt table so
        // brute force against either credential shares one budget.
        const allowed = await checkRateLimit(`email:${email}`);
        if (!allowed) return null;

        const user = await queryOne<DbUser>(
          `SELECT id, label, email, access_code, role, enabled, password_hash, must_change_password
           FROM users WHERE lower(email) = $1`,
          [email],
        );

        // Always run a real scrypt verification, even when no such account
        // exists, so "no user" and "wrong password" take the same time to
        // answer and the endpoint cannot be used to enumerate staff emails.
        const ok = await verifyPassword(password, user?.password_hash ?? DUMMY_PASSWORD_HASH);

        if (!user || !user.enabled || !user.password_hash || !ok) {
          await recordAttempt(`email:${email}`, false);
          return null;
        }

        await recordAttempt(`email:${email}`, true);
        await query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]).catch(() => {});

        return {
          id: user.id,
          name: user.label,
          email: user.email,
          role: user.role,
          label: user.label,
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

/**
 * Sets (or replaces) an account's login password.
 * Returns an error message when the password is too weak, null on success.
 */
export async function setUserPassword(
  userId: string,
  password: string,
  opts: { mustChange?: boolean } = {},
): Promise<string | null> {
  const problem = passwordProblem(password);
  if (problem) return problem;

  const hash = await hashPassword(password);
  await query(
    `UPDATE users
     SET password_hash = $2, password_updated_at = now(), must_change_password = $3, updated_at = now()
     WHERE id = $1`,
    [userId, hash, opts.mustChange ?? false],
  );
  return null;
}

/** Removes password login from an account, leaving its access code intact. */
export async function clearUserPassword(userId: string): Promise<void> {
  await query(
    `UPDATE users
     SET password_hash = NULL, password_updated_at = NULL, must_change_password = false, updated_at = now()
     WHERE id = $1`,
    [userId],
  );
}

/**
 * Creates an admin that signs in with email + password.
 * The access code is still generated, so either credential works.
 */
export async function createAdminLogin(opts: { label: string; email: string; password: string }) {
  const problem = passwordProblem(opts.password);
  if (problem) return { error: problem } as const;

  const email = opts.email.trim().toLowerCase();
  const existing = await queryOne<{ id: string }>('SELECT id FROM users WHERE lower(email) = $1', [email]);
  if (existing) return { error: 'An account with that email already exists' } as const;

  const user = await createAccount(opts.label.trim(), 'admin', email);
  if (!user) return { error: 'Failed to create account' } as const;

  const passwordProblemMessage = await setUserPassword(user.id, opts.password, { mustChange: true });
  if (passwordProblemMessage) return { error: passwordProblemMessage } as const;

  return { user } as const;
}
