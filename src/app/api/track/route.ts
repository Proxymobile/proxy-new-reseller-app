import { recordPageView } from '@/lib/page-views';
import { isPublicPath } from '@/lib/public-paths';
import { SITE_URL } from '@/lib/seo';

/**
 * Cookieless page-view beacon. Accepts {p: path, r: referrer, u: utm_source}.
 * Only public marketing paths are counted; the referrer is reduced to its
 * host and the user agent only decides mobile/desktop and bot filtering.
 */
const BOT_RE = /bot|crawl|spider|slurp|headless|preview|facebookexternalhit|curl|wget|python|httpclient|lighthouse|pingdom|uptime/i;
const MOBILE_RE = /mobi|android|iphone|ipad|ipod/i;
const OWN_HOST = new URL(SITE_URL).hostname.replace(/^www\./, '');

function sourceFrom(ref: unknown, utm: unknown): string {
  if (typeof utm === 'string') {
    const u = utm.trim().toLowerCase();
    if (/^[a-z0-9._-]{1,40}$/.test(u)) return `utm:${u}`;
  }
  if (typeof ref !== 'string' || !ref) return 'direct';
  try {
    const host = new URL(ref).hostname.toLowerCase().replace(/^www\./, '');
    if (!host || host.length > 80 || !/^[a-z0-9.-]+$/.test(host)) return 'direct';
    if (host === OWN_HOST || host === 'localhost') return 'internal';
    return host;
  } catch {
    return 'direct';
  }
}

export async function POST(request: Request) {
  const ua = request.headers.get('user-agent') ?? '';
  if (!ua || BOT_RE.test(ua)) return new Response(null, { status: 204 });

  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > 2000) return new Response(null, { status: 204 });
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 204 });
  }

  const path = typeof body.p === 'string' ? body.p.split(/[?#]/)[0] : '';
  if (!path || path.length > 200 || !isPublicPath(path)) {
    return new Response(null, { status: 204 });
  }

  try {
    await recordPageView(path, sourceFrom(body.r, body.u), MOBILE_RE.test(ua) ? 'mobile' : 'desktop');
  } catch (err) {
    console.error('[track] failed:', err instanceof Error ? err.message : err);
  }
  return new Response(null, { status: 204 });
}
