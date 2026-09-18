import { GATEWAY_HOST, GATEWAY_HTTP_PORT, GATEWAY_SOCKS5_PORT } from '@/lib/gateway';

/** Client-safe builder for customer proxy credentials (matches the gateway format). */
export type ProxyPool = 'mbl' | 'peer';
export type ProxyProtocol = 'http' | 'socks5';
export type Rotation = 'sticky' | 'auto10' | 'auto30' | 'hard' | 'none';

export interface ProxyOpts {
  country: string;
  pool: ProxyPool;
  rotation: Rotation;
  protocol: ProxyProtocol;
  sid?: string;
}

export const ROTATIONS: { value: Rotation; label: string; desc: string }[] = [
  { value: 'sticky', label: 'Sticky', desc: 'Keeps one device for the session. Best for logins, carts and multi-step flows.' },
  { value: 'auto10', label: 'Every 10 min', desc: 'Fresh IP roughly every 10 minutes. Good default for scrapers.' },
  { value: 'auto30', label: 'Every 30 min', desc: 'Slower rotation for long-running background jobs.' },
  { value: 'hard', label: 'Hard pin', desc: 'Strictest device pin the pool offers.' },
  { value: 'none', label: 'Gateway default', desc: 'No rotation token; the gateway decides.' },
];

export function proxyParts(username: string, pakKey: string, o: ProxyOpts) {
  const tokens: string[] = [o.pool, o.country];
  if (o.sid) tokens.push('sid', o.sid);
  if (o.rotation !== 'none') tokens.push('rot', o.rotation);
  return {
    host: GATEWAY_HOST,
    port: o.protocol === 'socks5' ? GATEWAY_SOCKS5_PORT : GATEWAY_HTTP_PORT,
    user: `${username}-${tokens.join('-')}`,
    pass: pakKey,
    scheme: o.protocol,
  };
}

export type OutputFormat = 'url' | 'hostport' | 'userpass';

export function formatProxy(username: string, pakKey: string, o: ProxyOpts, f: OutputFormat = 'url'): string {
  const p = proxyParts(username, pakKey, o);
  if (f === 'hostport') return `${p.host}:${p.port}:${p.user}:${p.pass}`;
  if (f === 'userpass') return `${p.user}:${p.pass}@${p.host}:${p.port}`;
  return `${p.scheme}://${encodeURIComponent(p.user)}:${encodeURIComponent(p.pass)}@${p.host}:${p.port}`;
}

export function randomSid(prefix = 's', len = 8): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return prefix + Array.from(bytes, (b) => (b % 36).toString(36)).join('');
}

export function maskSecret(url: string, secret: string): string {
  if (!secret) return url;
  const shown = `${secret.slice(0, 8)}…`;
  return url.split(secret).join(shown).split(encodeURIComponent(secret)).join(shown);
}
