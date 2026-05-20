import { ProxiesClient } from '@proxies-sx/pool-sdk';

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

export { getProxiesClient as proxies };
