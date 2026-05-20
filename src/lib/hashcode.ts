import { randomBytes, createHash } from 'crypto';

export function generateHashcode(): string {
  return randomBytes(6).toString('hex');
}

export function hashValue(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function generateAccountCode(email: string): string {
  const salt = randomBytes(4).toString('hex');
  const raw = `${email}:${salt}:${Date.now()}`;
  return createHash('sha256').update(raw).digest('hex').slice(0, 12);
}
