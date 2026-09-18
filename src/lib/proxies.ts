import { ProxiesClient } from '@proxies-sx/pool-sdk';
import { GATEWAY_HOST } from './gateway';

let _client: ProxiesClient | null = null;

export function getProxiesClient(): ProxiesClient {
  if (!_client) {
    if (!process.env.PROXIES_SX_API_KEY) {
      throw new Error('PROXIES_SX_API_KEY is required');
    }
    _client = new ProxiesClient({
      apiKey: process.env.PROXIES_SX_API_KEY,
      proxyUsername: process.env.PROXIES_SX_USERNAME ?? '',
      // Keep server-built URLs on the same hostname the dashboard and the
      // marketing pages advertise — see src/lib/gateway.ts.
      gatewayHost: GATEWAY_HOST,
      // Optional override for staging/tests; defaults to the SDK's production API.
      ...(process.env.PROXIES_SX_BASE_URL ? { baseUrl: process.env.PROXIES_SX_BASE_URL } : {}),
    });
  }
  return _client;
}

export { getProxiesClient as proxies };
