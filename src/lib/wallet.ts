import { createHmac, timingSafeEqual } from 'crypto';
import { verifyMessage } from 'viem';

const CHALLENGE_TTL = 5 * 60 * 1000; // 5 minutes

function getSecret(): string {
  return process.env.AUTH_SECRET || 'fallback-dev-secret';
}

// --- Login challenges (stateless HMAC approach) ---

export function createLoginChallenge(address: string) {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).slice(2);
  const nonce = `${timestamp}:${random}`;

  const hmac = createHmac('sha256', getSecret())
    .update(`${nonce}:${address.toLowerCase()}`)
    .digest('hex');

  const message = buildLoginMessage(address, nonce);
  return { nonce, hmac, message };
}

export function verifyLoginChallenge(nonce: string, hmac: string, address: string): boolean {
  const expected = createHmac('sha256', getSecret())
    .update(`${nonce}:${address.toLowerCase()}`)
    .digest('hex');

  if (expected.length !== hmac.length) return false;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(hmac))) return false;

  const timestamp = parseInt(nonce.split(':')[0], 10);
  if (isNaN(timestamp) || Date.now() - timestamp > CHALLENGE_TTL) return false;

  return true;
}

export function buildLoginMessage(address: string, nonce: string): string {
  return `Sign this message to log in to ProxyMobile.\n\nWallet: ${address}\nNonce: ${nonce}`;
}

// --- Link challenges (message format for wallet linking) ---

export function buildLinkMessage(chain: string, nonce: string): string {
  return `ProxyMobile wallet verification\n\nSign this message to link your ${chain} wallet.\n\nNonce: ${nonce}`;
}

// --- ETH signature verification ---

export async function verifyEthSignature(
  message: string,
  signature: string,
  expectedAddress: string,
): Promise<boolean> {
  try {
    return await verifyMessage({
      address: expectedAddress as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
  } catch {
    return false;
  }
}
