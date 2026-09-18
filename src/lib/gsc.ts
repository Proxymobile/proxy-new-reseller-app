import { createSign } from 'crypto';
import { SITE_URL } from '@/lib/seo';

/**
 * Minimal Google Search Console API client.
 *
 * Auth is a service-account JWT signed with the account's private key and
 * exchanged for an access token — the whole OAuth dance is ~40 lines with
 * `fetch` + `crypto`, so no googleapis dependency is pulled in.
 *
 * Setup (once):
 *   1. Google Cloud console → new project → enable "Google Search Console API".
 *   2. Create a service account, then a JSON key for it.
 *   3. Search Console → Settings → Users and permissions → add the service
 *      account's client_email as a Full or Restricted user.
 *   4. Set env vars (see below) and redeploy.
 *
 * Env:
 *   GSC_SERVICE_ACCOUNT_JSON  the whole key JSON (one line, or base64-encoded)
 *   -- or --
 *   GSC_CLIENT_EMAIL          service account email
 *   GSC_PRIVATE_KEY           the PEM private key ("\n" escapes are accepted)
 *
 *   GSC_SITE_URL              property as GSC spells it. Defaults to the
 *                             domain property for SITE_URL, e.g.
 *                             "sc-domain:proxymobile.shop". For a URL-prefix
 *                             property use "https://proxymobile.shop/".
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

export interface GscCredentials {
  clientEmail: string;
  privateKey: string;
}

export function gscSiteUrl(): string {
  const explicit = process.env.GSC_SITE_URL?.trim();
  if (explicit) return explicit;
  return `sc-domain:${new URL(SITE_URL).hostname}`;
}

/** Reads credentials from env. Returns null when SEO sync is not configured. */
export function gscCredentials(): GscCredentials | null {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON?.trim();
  if (raw) {
    try {
      // Accept either raw JSON or base64-encoded JSON (easier in some hosts).
      const text = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf-8');
      const parsed = JSON.parse(text) as { client_email?: string; private_key?: string };
      if (parsed.client_email && parsed.private_key) {
        return { clientEmail: parsed.client_email, privateKey: normalizeKey(parsed.private_key) };
      }
    } catch {
      return null;
    }
    return null;
  }

  const clientEmail = process.env.GSC_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GSC_PRIVATE_KEY;
  if (clientEmail && privateKey) {
    return { clientEmail, privateKey: normalizeKey(privateKey) };
  }
  return null;
}

export function isGscConfigured(): boolean {
  return gscCredentials() !== null;
}

function normalizeKey(key: string): string {
  // Env vars usually carry the PEM with literal "\n" sequences.
  return key.includes('\\n') ? key.replace(/\\n/g, '\n') : key;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Token cache — a token is good for an hour; re-minting it on every call is waste. */
let cached: { token: string; expiresAt: number } | null = null;

async function getAccessToken(creds: GscCredentials): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: creds.clientEmail,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));

  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claims}`);
  const signature = b64url(signer.sign(creds.privateKey));
  const assertion = `${header}.${claims}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Google token request failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error('Google token response had no access_token');

  cached = { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return data.access_token;
}

export interface GscRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/**
 * One searchanalytics.query call. `dimensions` is any of
 * 'date' | 'query' | 'page' | 'country' | 'device'.
 */
export async function gscQuery(opts: {
  startDate: string;
  endDate: string;
  dimensions: string[];
  rowLimit?: number;
  startRow?: number;
}): Promise<GscRow[]> {
  const creds = gscCredentials();
  if (!creds) throw new Error('Search Console is not configured (set GSC_SERVICE_ACCOUNT_JSON)');

  const token = await getAccessToken(creds);
  const site = encodeURIComponent(gscSiteUrl());

  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: opts.startDate,
        endDate: opts.endDate,
        dimensions: opts.dimensions,
        rowLimit: opts.rowLimit ?? 5000,
        startRow: opts.startRow ?? 0,
        dataState: 'all',
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 403) {
      throw new Error(
        `Search Console denied access to ${gscSiteUrl()}. Add ${creds.clientEmail} as a user on that property.`,
      );
    }
    throw new Error(`Search Console query failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as { rows?: GscRow[] };
  return data.rows ?? [];
}

/** YYYY-MM-DD, `daysAgo` days before today in UTC. */
export function isoDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}
