import { ProxiesApiError, ProxiesClient } from '@proxies-sx/pool-sdk';

let _client: ProxiesClient | null = null;

export function getProxiesClient(): ProxiesClient {
  if (!_client) {
    if (!process.env.PROXIES_SX_API_KEY) {
      throw new Error('PROXIES_SX_API_KEY is required');
    }
    _client = new ProxiesClient({
      apiKey: process.env.PROXIES_SX_API_KEY,
      proxyUsername: process.env.PROXIES_SX_USERNAME ?? '',
    });
  }
  return _client;
}

/**
 * The reseller's `psx_…` proxy username — the first segment of every proxy
 * username a customer uses. Without it every generated proxy string fails auth
 * at the gateway, so fail loudly instead of handing out broken credentials.
 */
export function getProxyUsername(): string {
  const username = process.env.PROXIES_SX_USERNAME?.trim();
  if (!username) {
    throw new Error('PROXIES_SX_USERNAME is required');
  }
  return username;
}

/** True when the upstream reports the pool key no longer exists. */
export function isNotFound(err: unknown): boolean {
  return err instanceof ProxiesApiError && err.status === 404;
}

/** Log-safe description of an SDK error, including the upstream request id. */
export function describeProxiesError(err: unknown): string {
  if (err instanceof ProxiesApiError) {
    return `${err.status} ${err.message}${err.requestId ? ` (req: ${err.requestId})` : ''}`;
  }
  return err instanceof Error ? err.message : String(err);
}

export { getProxiesClient as proxies };
