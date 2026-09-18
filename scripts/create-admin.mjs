#!/usr/bin/env node
/**
 * Creates (or updates) an admin login that signs in with email + password.
 *
 * The first admin has to be made from outside the panel, since the panel
 * itself requires an admin to open it.
 *
 *   node --env-file-if-exists=.env scripts/create-admin.mjs \
 *     --email you@proxymobile.shop --name Lukas [--password 'Correct Horse 9'] 
 *
 * With no --password a strong one is generated and printed once.
 * Re-running with an existing email resets that account's password.
 */
import { Pool } from 'pg';
import { randomBytes, scrypt as scryptCb } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCb);
const N = 2 ** 15, R = 8, P = 1, KEYLEN = 64;

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')
    ? process.argv[i + 1]
    : null;
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize('NFKC'), salt, KEYLEN, {
    N, r: R, p: P, maxmem: 128 * N * R * 2,
  });
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
}

function generatePassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = randomBytes(24);
  let out = '';
  for (let i = 0; i < 20; i++) out += alphabet[bytes[i] % alphabet.length];
  return `${out.slice(0, 6)}-${out.slice(6, 13)}-${out.slice(13)}9Aa`;
}

function generateAccessCode() {
  const raw = randomBytes(8).toString('hex');
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
}

function problem(pw) {
  if (pw.length < 12) return 'Password must be at least 12 characters';
  if (!/[a-z]/.test(pw)) return 'Password must contain a lowercase letter';
  if (!/[A-Z]/.test(pw)) return 'Password must contain an uppercase letter';
  if (!/[0-9]/.test(pw)) return 'Password must contain a digit';
  return null;
}

const email = arg('email')?.trim().toLowerCase();
const name = arg('name')?.trim() ?? 'Admin';
let password = arg('password');

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
  console.error('Usage: node scripts/create-admin.mjs --email you@example.com [--name Name] [--password "..."]');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Run with: node --env-file-if-exists=.env scripts/create-admin.mjs ...');
  process.exit(1);
}

const generated = !password;
if (generated) password = generatePassword();

const bad = problem(password);
if (bad) {
  console.error(bad);
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  // The password columns ship in migration 007 — fail loudly if it has not run.
  const { rows: cols } = await pool.query(
    "SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash'",
  );
  if (cols.length === 0) {
    console.error('The users table has no password_hash column. Run `npm run db:migrate` first.');
    process.exit(1);
  }

  const hash = await hashPassword(password);
  const { rows: existing } = await pool.query('SELECT id, role FROM users WHERE lower(email) = $1', [email]);

  let id;
  if (existing.length > 0) {
    id = existing[0].id;
    await pool.query(
      `UPDATE users
       SET role = 'admin', enabled = true, password_hash = $2,
           password_updated_at = now(), must_change_password = true, updated_at = now()
       WHERE id = $1`,
      [id, hash],
    );
    console.log(`Updated existing account ${email} — it is now an enabled admin with a new password.`);
  } else {
    const { rows } = await pool.query(
      `INSERT INTO users (label, email, access_code, role, password_hash, password_updated_at, must_change_password)
       VALUES ($1, $2, $3, 'admin', $4, now(), true)
       RETURNING id, access_code`,
      [name, email, generateAccessCode(), hash],
    );
    id = rows[0].id;
    console.log(`Created admin ${name} <${email}>`);
    console.log(`Access code (fallback login): ${rows[0].access_code}`);
  }

  console.log('');
  console.log(`  Sign in at /login → "Staff sign-in"`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log('');
  console.log(generated
    ? 'This generated password is shown once. Copy it now, then change it in Admin → Admin logins.'
    : 'Change this password after the first sign-in, in Admin → Admin logins.');
} catch (err) {
  console.error('Failed:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
