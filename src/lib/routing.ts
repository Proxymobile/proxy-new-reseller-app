/**
 * Customer-facing proxy routing — the single place that turns a product
 * choice ("mobile IPs in Germany, sticky") into gateway username tokens.
 *
 * Browser-safe: imports only `buildProxyUrl` from the SDK, which has no
 * secrets and no network access. The reseller API key never comes near this.
 *
 * Grammar reference (single source of truth upstream):
 * https://github.com/bolivian-peru/proxy-reseller-kit/blob/main/docs/USERNAME-DSL.md
 */
import { buildProxyUrl, type BuildProxyUrlOpts, type RotationMode } from '@proxies-sx/pool-sdk';

export const GATEWAY_HOST = 'gw.proxies.sx';
export const HTTP_PORT = 7000;
export const SOCKS5_PORT = 7001;

/** What the customer buys: real carrier IPs, or home-ISP residential IPs. */
export type Network = 'mobile' | 'residential';
export type Protocol = 'http' | 'socks5';

export interface RotationOption {
  value: RotationMode;
  label: string;
  description: string;
  /** Whether the mode only works with a named session (`-sid-`). */
  needsSession: boolean;
}

/**
 * Only modes the gateway actually implements. `hard` is omitted on purpose —
 * at routing time it is identical to `sticky`, and the name misleads people
 * into expecting a new IP per request. Omitting `-rot-` means `auto10`.
 */
export const ROTATIONS: RotationOption[] = [
  {
    value: 'sticky',
    label: 'Sticky session',
    description: 'Keeps the same device for the whole session. Best for logins and accounts.',
    needsSession: true,
  },
  {
    value: 'auto5',
    label: 'Rotate every 5 min',
    description: 'Switches to a different device about every 5 minutes.',
    needsSession: true,
  },
  {
    value: 'auto10',
    label: 'Rotate every 10 min',
    description: 'Switches to a different device about every 10 minutes.',
    needsSession: true,
  },
  {
    value: 'auto20',
    label: 'Rotate every 20 min',
    description: 'Switches to a different device about every 20 minutes.',
    needsSession: true,
  },
  {
    value: 'auto60',
    label: 'Rotate every 60 min',
    description: 'Switches to a different device about every hour.',
    needsSession: true,
  },
  {
    value: 'ondemand',
    label: 'New IP per connection',
    description: 'Every new connection your client opens lands on a fresh device. Best for scraping.',
    needsSession: false,
  },
];

export function rotationOption(value: string): RotationOption {
  return ROTATIONS.find((r) => r.value === value) ?? ROTATIONS[0];
}

export function isRotation(value: unknown): value is RotationMode {
  return typeof value === 'string' && ROTATIONS.some((r) => r.value === value);
}

/**
 * Map a product choice to pool + IP-class tokens.
 *
 * Mobile: countries with carrier-modem stock use the dedicated `mbl` tier
 * (ultra-stable, monitored). Everywhere else we use the peer network filtered
 * to `iptype-mobile` — a HARD filter, so the customer never silently gets a
 * residential IP when they paid for mobile.
 *
 * Residential: peer network filtered to `iptype-residential`.
 */
export function routeFor(
  network: Network,
  hasModemStock: boolean,
): Pick<BuildProxyUrlOpts, 'pool' | 'ipType'> {
  if (network === 'residential') {
    return { pool: 'peer', ipType: 'residential' };
  }
  if (hasModemStock) {
    return { pool: 'mbl' };
  }
  return { pool: 'peer', ipType: 'mobile' };
}

/**
 * A session id the gateway parses safely: `[a-z0-9_]{1,64}`, no `-` (the
 * username is split on `-`). 12 random chars ≈ 62 bits, so two customers can
 * never collide on one session.
 */
export function newSessionId(prefix = 's'): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let id = '';
  for (const b of bytes) id += alphabet[b % alphabet.length];
  const safePrefix = sanitizeSessionPrefix(prefix);
  return `${safePrefix}${safePrefix ? '_' : ''}${id}`.slice(0, 64);
}

/** Lowercase, strip anything outside `[a-z0-9_]`, cap at the gateway's 64. */
export function sanitizeSessionId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 64);
}

/** A session-id prefix: sanitized and short enough to leave room for entropy. */
export function sanitizeSessionPrefix(prefix: string): string {
  return sanitizeSessionId(prefix).slice(0, 20);
}

export interface ProxyRequest {
  proxyUsername: string;
  pakKey: string;
  network: Network;
  country: string;
  hasModemStock: boolean;
  rotation: RotationMode;
  protocol: Protocol;
  /** Session id; only emitted for modes that need one. */
  sid?: string;
}

export interface ProxyCredentials {
  protocol: Protocol;
  host: string;
  port: number;
  username: string;
  password: string;
  /** `http://user:pass@host:port` — URL-encoded, paste into any client. */
  url: string;
}

export function buildCredentials(req: ProxyRequest): ProxyCredentials {
  const option = rotationOption(req.rotation);
  const url = buildProxyUrl(req.proxyUsername, req.pakKey, {
    ...routeFor(req.network, req.hasModemStock),
    country: req.country,
    rotation: req.rotation,
    sid: option.needsSession ? req.sid : undefined,
    protocol: req.protocol,
  });
  const port = req.protocol === 'socks5' ? SOCKS5_PORT : HTTP_PORT;
  // Everything between "://" and the last "@" is "user:pass" (URL-encoded).
  const auth = url.slice(url.indexOf('://') + 3, url.lastIndexOf('@'));
  const [user, pass] = auth.split(':');
  return {
    protocol: req.protocol,
    host: GATEWAY_HOST,
    port,
    username: decodeURIComponent(user),
    password: decodeURIComponent(pass),
    url,
  };
}

export type OutputFormat = 'url' | 'host_port_user_pass' | 'user_pass_host_port';

export const OUTPUT_FORMATS: { value: OutputFormat; label: string; example: string }[] = [
  { value: 'url', label: 'URL', example: 'http://user:pass@host:port' },
  { value: 'host_port_user_pass', label: 'host:port:user:pass', example: 'host:port:user:pass' },
  { value: 'user_pass_host_port', label: 'user:pass@host:port', example: 'user:pass@host:port' },
];

export function formatCredentials(c: ProxyCredentials, format: OutputFormat): string {
  switch (format) {
    case 'host_port_user_pass':
      return `${c.host}:${c.port}:${c.username}:${c.password}`;
    case 'user_pass_host_port':
      return `${c.username}:${c.password}@${c.host}:${c.port}`;
    default:
      return c.url;
  }
}

/** Ready-to-run snippets that prove the proxy works end to end. */
export function codeSnippets(c: ProxyCredentials): { id: string; label: string; code: string }[] {
  // socks5h = resolve DNS through the proxy, so lookups exit in-country too.
  const remoteDnsUrl = c.protocol === 'socks5' ? c.url.replace(/^socks5:/, 'socks5h:') : c.url;
  return [
    {
      id: 'curl',
      label: 'cURL',
      code: `curl -x '${remoteDnsUrl}' https://api.ipify.org`,
    },
    {
      id: 'python',
      label: 'Python',
      code: [
        c.protocol === 'socks5' ? '# pip install "requests[socks]"' : '# pip install requests',
        'import requests',
        '',
        `proxy = "${remoteDnsUrl}"`,
        'r = requests.get("https://api.ipify.org", proxies={"http": proxy, "https": proxy}, timeout=30)',
        'print(r.text)',
      ].join('\n'),
    },
    {
      id: 'node',
      label: 'Node.js',
      code: c.protocol === 'socks5'
        ? [
            '// npm i axios socks-proxy-agent',
            "import axios from 'axios';",
            "import { SocksProxyAgent } from 'socks-proxy-agent';",
            '',
            `const agent = new SocksProxyAgent('${remoteDnsUrl}');`,
            "const { data } = await axios.get('https://api.ipify.org', { httpAgent: agent, httpsAgent: agent });",
            'console.log(data);',
          ].join('\n')
        : [
            '// npm i undici',
            "import { ProxyAgent, fetch } from 'undici';",
            '',
            `const dispatcher = new ProxyAgent('${c.url}');`,
            "const res = await fetch('https://api.ipify.org', { dispatcher });",
            'console.log(await res.text());',
          ].join('\n'),
    },
  ];
}
