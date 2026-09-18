/**
 * Public marketing routes that analytics may count. Account, checkout, admin
 * and API routes never match. Shared by Google Analytics and the first-party
 * page-view beacon so both measure the same pages. Includes the /zh copies.
 */
export function isPublicPath(path: string): boolean {
  const p = path === '/zh' ? '/' : path.startsWith('/zh/') ? path.slice(3) : path;
  return p === '/' || p === '/terms' || p === '/privacy' ||
    p === '/mobile-proxy-api' || p.startsWith('/mobile-proxies/') ||
    p.startsWith('/mobile-proxies-for-') ||
    p === '/playwright-mobile-proxy' || p === '/python-mobile-proxy' ||
    p === '/puppeteer-mobile-proxy';
}
