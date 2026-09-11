/**
 * The proxy gateway host customers connect to.
 *
 * This is the ONLY place the hostname is written down. It is used for the
 * connection strings shown in the dashboard, the examples on the marketing
 * pages, AND the URLs built server-side, so what a customer copies is always
 * what actually routes.
 *
 * IMPORTANT: this hostname must have a DNS record pointing at the pool
 * gateway. Changing it here changes what customers are told to connect to —
 * if the name does not resolve to the gateway, every connection string on the
 * site stops working. Override without a code change by setting
 * NEXT_PUBLIC_GATEWAY_HOST in the environment.
 */
export const GATEWAY_HOST =
  process.env.NEXT_PUBLIC_GATEWAY_HOST ?? 'proxies.mobile';

/** HTTP/HTTPS proxy port. */
export const GATEWAY_HTTP_PORT = 7000;

/** SOCKS5 proxy port. */
export const GATEWAY_SOCKS5_PORT = 7001;

/** `host:port` for the given protocol — handy for display strings. */
export function gatewayEndpoint(protocol: 'http' | 'socks5' = 'http'): string {
  return `${GATEWAY_HOST}:${protocol === 'socks5' ? GATEWAY_SOCKS5_PORT : GATEWAY_HTTP_PORT}`;
}
