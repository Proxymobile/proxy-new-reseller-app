/**
 * The proxy gateway, split into two names on purpose.
 *
 * GATEWAY_HOST is the host that actually routes. Everything a customer can
 * paste into an HTTP client and expect to work is built from it: the URLs
 * generated server-side, the SDK's gatewayHost, and the connection strings on
 * the dashboard. It must have a DNS record pointing at the pool gateway — if
 * the name does not resolve, every real proxy URL stops working. That is why
 * the default here is the upstream host we know resolves, rather than the
 * brand name: a deploy that forgets the env override degrades to working
 * URLs under the old name instead of shipping URLs that connect to nothing.
 *
 * GATEWAY_DISPLAY_HOST is branding. It appears only in marketing copy, where
 * the surrounding credentials are masked placeholders (`pmk_***`, `PAK_KEY`)
 * and nothing is functional anyway. It exists so the site can show the brand
 * before that hostname is registered and pointed at the gateway.
 *
 * They are allowed to differ, but the gap is a liability, not a feature: while
 * they differ, a visitor who copies a snippet off the landing page and swaps in
 * a real key gets a host that does not resolve. Once proxies.mobile has DNS
 * pointing at the gateway, change this default to match the display host and
 * drop any NEXT_PUBLIC_GATEWAY_HOST override in prod, so both constants hold
 * one value and the marketing examples become genuinely runnable.
 *
 * Override either without a code change via NEXT_PUBLIC_GATEWAY_HOST /
 * NEXT_PUBLIC_GATEWAY_DISPLAY_HOST.
 */
export const GATEWAY_HOST =
  process.env.NEXT_PUBLIC_GATEWAY_HOST ?? 'gw.proxies.sx';

/** Brand hostname for marketing copy only. Never build a real URL from this. */
export const GATEWAY_DISPLAY_HOST =
  process.env.NEXT_PUBLIC_GATEWAY_DISPLAY_HOST ?? 'proxies.mobile';

/** HTTP/HTTPS proxy port. */
export const GATEWAY_HTTP_PORT = 7000;

/** SOCKS5 proxy port. */
export const GATEWAY_SOCKS5_PORT = 7001;

/** `host:port` that actually routes — for anything a customer will really use. */
export function gatewayEndpoint(protocol: 'http' | 'socks5' = 'http'): string {
  return `${GATEWAY_HOST}:${protocol === 'socks5' ? GATEWAY_SOCKS5_PORT : GATEWAY_HTTP_PORT}`;
}

/** `host:port` for marketing copy. Display only — does not necessarily route. */
export function gatewayDisplayEndpoint(protocol: 'http' | 'socks5' = 'http'): string {
  return `${GATEWAY_DISPLAY_HOST}:${protocol === 'socks5' ? GATEWAY_SOCKS5_PORT : GATEWAY_HTTP_PORT}`;
}
