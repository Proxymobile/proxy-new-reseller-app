/**
 * Content for the intent-based SEO landing pages at /{slug}.
 *
 * These target buying intent ("mobile proxies for price monitoring") rather
 * than geography, which the /mobile-proxies/[country] pages already cover.
 * Each entry carries its own problem statement, runnable code, rotation
 * guidance and bandwidth maths — deliberately not a template with the use case
 * swapped in, because near-duplicate pages get filtered rather than ranked.
 *
 * Positioning rule: these pages lead with ad verification, regional QA,
 * pricing data and developer automation. Multi-account social automation is
 * not a headline use case anywhere in here — it drives chargebacks and
 * compliance load, and it attracts the traffic we least want to convert.
 *
 * Every code sample must actually run against the pool as written, given a
 * real PROXY_URL. If you change how the gateway behaves, change these too.
 */

import { GATEWAY_DISPLAY_HOST, GATEWAY_HTTP_PORT } from '@/lib/gateway';

export interface UseCaseCode {
  label: string;
  lang: string;
  code: string;
  /** One line under the block explaining what to look at. */
  note?: string;
}

export interface UseCaseFaq {
  q: string;
  a: string;
}

/** One row of the "what a gigabyte actually buys you" table. */
export interface BandwidthRow {
  workload: string;
  perUnit: string;
  perGb: string;
}

export interface RotationAlternative {
  mode: string;
  when: string;
}

export interface UseCaseCountry {
  /** Slug into COUNTRIES, so the page can link to the country page. */
  slug: string;
  why: string;
}

export interface UseCasePage {
  slug: string;
  /** Groups the cross-links: buyer-intent pages vs developer-stack pages. */
  group: 'use-case' | 'stack';
  /** Short label for cross-link lists and breadcrumbs. */
  label: string;
  title: string;
  description: string;
  h1: string;
  badge: string;
  intro: string;
  keywords: string[];
  problem: {
    heading: string;
    body: string;
    /** Concrete symptoms a buyer will recognise from their own logs. */
    symptoms: string[];
  };
  code: UseCaseCode[];
  rotation: {
    mode: string;
    /** The literal username token, e.g. "-rot-auto10". */
    token: string;
    why: string;
    alternatives: RotationAlternative[];
  };
  bandwidth: {
    lead: string;
    rows: BandwidthRow[];
    tip: string;
  };
  countries: UseCaseCountry[];
  /** Page-specific acceptable-use bullets, shown under the shared notice. */
  legitimate: string[];
  faqs: UseCaseFaq[];
  /** Slugs of related pages, for internal linking. */
  related: string[];
}

/** Shown on every intent page, above the page-specific bullets. */
export const LEGITIMATE_USE_NOTICE = {
  heading: 'Legitimate use only',
  body:
    'ProxyMobile is sold for measurement, quality assurance and research on systems you own or are authorised to test. Buying bandwidth does not grant permission to access a third party\'s systems. You remain responsible for complying with each target\'s terms of service, robots directives and rate limits, and with the data-protection law that applies to you.',
  /** Applies to every page; the per-page list adds to this. */
  universal: [
    'No credential stuffing, account takeover, or any attempt to authenticate as someone else.',
    'No circumventing an access control, paywall or security measure you have not been authorised to test.',
    'No collection of personal data you have no lawful basis to process.',
    'No load that a reasonable operator would experience as a denial of service — throttle, back off on 429s, and honour Retry-After.',
  ],
  footer:
    'Accounts used for fraud, intrusion or bulk abuse are terminated without refund, and we cooperate with valid legal process.',
} as const;

/** The one-liner that puts a working URL in the environment. */
function proxyUrlExport(pool: string, country: string, rot: string, sid?: string) {
  const tokens = ['USERNAME', pool, country];
  if (sid) tokens.push('sid', sid);
  tokens.push('rot', rot);
  return `export PROXY_URL="http://${tokens.join('-')}:PAK_KEY@${GATEWAY_DISPLAY_HOST}:${GATEWAY_HTTP_PORT}"`;
}

export const USE_CASE_PAGES: UseCasePage[] = [
  // ───────────────────────────────────────────── ad verification
  {
    slug: 'mobile-proxies-for-ad-verification',
    group: 'use-case',
    label: 'Ad verification',
    title: 'Mobile Proxies for Ad Verification — See the Creative a Real Subscriber Sees | ProxyMobile',
    description:
      'Verify ad delivery, geo-targeting and creative rendering from real 4G/5G carrier IPs. Working Playwright and Python examples, rotation guidance and bandwidth maths. Pay per GB from $5.',
    h1: 'Mobile proxies for ad verification',
    badge: 'Ad verification · Real carrier IPs',
    intro:
      'Ad servers do not treat all traffic alike. A request from a cloud IP is frequently answered with a house ad, a blank slot, or a different creative than the one a paying subscriber receives — which means a verification run from your own infrastructure is measuring the wrong thing. Checking from a real carrier IP in the market you bought inventory in gives you the delivery a real user actually saw.',
    keywords: [
      'mobile proxies for ad verification',
      'ad verification proxy',
      'ad fraud detection proxy',
      'creative verification mobile proxy',
      'geo targeting verification proxy',
      '4g proxy ad verification',
    ],
    problem: {
      heading: 'The problem: your verification traffic is being profiled',
      body:
        'Programmatic supply chains fingerprint the requesting IP before they decide what to return. Datacentre ranges are published and widely blocklisted as invalid traffic, so the exchange either withholds a bid, serves a default, or silently downgrades what it hands back. The result is a verification pipeline that reports "creative did not render" for placements that render perfectly for real users, and misses the cases where a publisher genuinely did swap the creative. Neither error is visible from inside the report — both look like data.',
      symptoms: [
        'Your DSP reports delivery that your own crawler cannot reproduce.',
        'A misplacement complaint from a client that you cannot reproduce from the office.',
        'Geo-targeted campaigns that appear to serve the wrong country when you check them, but only when you check them.',
        'Blank slots or house ads on every scripted visit, and correct creatives on a phone.',
        'No way to evidence domain spoofing or creative swapping when you suspect it.',
      ],
    },
    code: [
      {
        label: 'Set the connection URL',
        lang: 'bash',
        code: `${proxyUrlExport('mbl', 'us', 'auto10', 'check01')}

# Copy your exact URL from the dashboard — USERNAME and PAK_KEY are yours.
# The -sid- token picks a device; vary it per check (see rotation, below).`,
      },
      {
        label: 'Playwright — render the placement and capture it',
        lang: 'javascript',
        code: `import { chromium } from 'playwright';

const url = new URL(process.env.PROXY_URL);

const browser = await chromium.launch({
  proxy: {
    server: \`http://\${url.host}\`,
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  },
});

const page = await browser.newPage({
  viewport: { width: 390, height: 844 },   // iPhone-class viewport
  isMobile: true,
  deviceScaleFactor: 3,
});

// Record every ad request the page makes, so you can evidence what served.
const adCalls = [];
page.on('request', (r) => {
  if (/doubleclick|googlesyndication|adnxs|criteo|rubiconproject/.test(r.url())) {
    adCalls.push({ url: r.url(), type: r.resourceType() });
  }
});

await page.goto('https://publisher.example/article', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'placement.png', fullPage: false });

console.log(\`exit IP served \${adCalls.length} ad calls\`);
console.table(adCalls.slice(0, 10));

await browser.close();`,
        note: 'The screenshot is your evidence artifact; adCalls is the audit trail of which exchanges actually bid.',
      },
      {
        label: 'Python — confirm the exit IP before you trust a run',
        lang: 'python',
        code: `import os, requests

proxy = os.environ["PROXY_URL"]
proxies = {"http": proxy, "https": proxy}

# Always assert geo before a verification sweep. A run from the wrong
# country is worse than no run — it looks like a delivery failure.
who = requests.get("https://ipinfo.io/json", proxies=proxies, timeout=30).json()
assert who["country"] == "US", f"expected US exit, got {who['country']}"
print(f"verifying from {who['city']}, {who['org']}")`,
        note: 'Cheap, and it turns a whole class of silent false negatives into a loud assertion.',
      },
    ],
    rotation: {
      mode: 'auto10',
      token: '-rot-auto10',
      why:
        'Ad servers apply frequency capping per user. The second and third impression request from one IP is deliberately answered differently from the first, so a tight loop against a single exit measures the cap, not the campaign. auto10 moves you to a fresh carrier IP roughly every ten minutes, which matches a realistic checking cadence. For a sweep that needs many distinct viewers in a short window, give each check its own -sid- value: reconnecting under a different session id lands you on a different device, so consecutive checks are not answered from the same handset.',
      alternatives: [
        { mode: 'sticky', when: 'You need to complete a multi-step landing page funnel — click through, form fill, conversion pixel — without the IP changing mid-journey and breaking attribution.' },
        { mode: 'auto30', when: 'Long unattended monitoring where a slower churn is fine and you would rather not burn through distinct IPs.' },
        { mode: 'none', when: 'Rarely useful here. Without a rotation directive you inherit the gateway default, which makes your sampling pattern hard to reason about.' },
      ],
    },
    bandwidth: {
      lead:
        'Ad verification is the most bandwidth-hungry workload we sell, because the whole point is to render the page the way a browser does — creatives, trackers, video and all. Budget for full page loads, not HTML.',
      rows: [
        { workload: 'Article page with display slots, full render', perUnit: '2–4 MB', perGb: '~260–520 checks' },
        { workload: 'Page with an autoplay video creative', perUnit: '8–20 MB', perGb: '~50–130 checks' },
        { workload: 'Render with images and fonts blocked', perUnit: '400–800 KB', perGb: '~1,300–2,600 checks' },
        { workload: 'Exit-IP assertion only (no render)', perUnit: '~2 KB', perGb: 'effectively free' },
      ],
      tip:
        'If you only need to prove which creative served — not how it looked — block images, media and fonts via route interception and keep the screenshot step for the placements that actually fail. That typically cuts a verification run by 70–80% with no loss of evidential value. These are measured estimates from typical ad-supported pages; your own targets will vary, so meter a small run before sizing a monthly budget.',
    },
    countries: [
      { slug: 'usa', why: 'The deepest programmatic market, and the one where datacentre filtering is most aggressive — verification from a US carrier IP is where the gap between cloud and mobile delivery shows up most clearly.' },
      { slug: 'uk', why: 'Heavily brand-safety audited inventory; useful when a client wants evidence that a placement met its geo and adjacency terms.' },
      { slug: 'germany', why: 'Consent-gated delivery means the creative you get depends on the CMP flow, which behaves differently for traffic that looks automated.' },
      { slug: 'france', why: 'Strong local publisher ecosystem with its own exchanges, poorly represented in cloud-based checks.' },
      { slug: 'spain', why: 'Common target for regional campaign splits where advertisers want proof the Spanish creative, not the LatAm one, actually served.' },
    ],
    legitimate: [
      'Verify campaigns you are running, or that a client has engaged you to audit — not a competitor\'s private delivery.',
      'Do not click, convert or otherwise interact with an ad you are only verifying. Generating billable events you did not intend is ad fraud regardless of motive.',
      'Keep verification volume proportionate to the campaign. A checking cadence that meaningfully distorts a publisher\'s impression counts is a cost you are imposing on someone else.',
    ],
    faqs: [
      {
        q: 'Why not just use a datacentre proxy for ad verification?',
        a: 'Because the exchange can tell. Datacentre ranges are published and widely classified as invalid traffic, so many bidders will not serve a real creative to them at all. You get a technically successful request that contains the wrong answer, which is the most expensive kind of measurement error.',
      },
      {
        q: 'Can I prove which creative served for a dispute?',
        a: 'Yes — capture both a screenshot and the list of ad-network requests the page made, as the Playwright example does. The screenshot shows rendering; the request log shows which exchange and creative ID actually responded, which is the part that holds up in a conversation with a publisher.',
      },
      {
        q: 'How many checks can I run on a gigabyte?',
        a: 'Roughly 260 to 520 full page renders on a typical ad-supported article, or 1,300 to 2,600 if you block images and fonts. Video creatives are far heavier. Meter a small run against your own targets before committing to a monthly budget.',
      },
      {
        q: 'Which rotation mode should I use?',
        a: 'Start with auto10 and give each check its own -sid- token. Frequency capping means repeated requests from one IP are answered differently by design, so sampling from a single sticky session will understate delivery.',
      },
      {
        q: 'Do you offer a trial?',
        a: 'Your first top-up is credited with $2 on top, which is enough to run a real verification sweep against your own placements before you commit to a larger balance.',
      },
    ],
    related: ['mobile-proxies-for-geo-testing', 'mobile-proxies-for-serp-tracking', 'playwright-mobile-proxy'],
  },

  // ───────────────────────────────────────────── price monitoring
  {
    slug: 'mobile-proxies-for-price-monitoring',
    group: 'use-case',
    label: 'Price monitoring',
    title: 'Mobile Proxies for Price Monitoring — Accurate Regional Pricing Data | ProxyMobile',
    description:
      'Collect competitor pricing, stock and shipping data without stale reads or block pages. Real 4G/5G carrier IPs, working Python examples, rotation and bandwidth guidance. From $5/GB.',
    h1: 'Mobile proxies for price monitoring',
    badge: 'Pricing data · 11 countries',
    intro:
      'Retail, travel and marketplace sites localise aggressively: the price, currency, stock status and delivery estimate you are shown all depend on where the request appears to come from. They also rate-limit hard. Together those two facts mean a repricing pipeline fed from one fixed IP drifts quietly wrong — and a wrong price that arrives on schedule looks exactly like a right one.',
    keywords: [
      'mobile proxies for price monitoring',
      'price scraping proxy',
      'competitor price tracking proxy',
      'ecommerce scraping mobile proxy',
      'retail price monitoring proxy',
      'dynamic pricing data proxy',
    ],
    problem: {
      heading: 'The problem: silent staleness, not loud failures',
      body:
        'The failure mode that costs money is not the 403 — you can see a 403. It is the page that returns 200 with a cached, default-region or logged-out price, served because the site decided your IP was not a shopper. Your parser is happy, your dashboard is green, and your repricing engine is now acting on a number that no customer would ever be quoted. Carrier IPs get the shopper treatment because they look like shoppers, which is the entire reason this workload moved to mobile pools.',
      symptoms: [
        'A competitor\'s price that has not moved in weeks, while their site shows it changing daily.',
        'Prices in the wrong currency, or with the wrong VAT treatment, for the market you are tracking.',
        '"Out of stock" everywhere, because the stock check is geo-scoped and your exit is not in the region.',
        'Escalating captcha and interstitial rates the longer a crawl runs.',
        'Shipping estimates that never populate, because they depend on a plausible postal geography.',
      ],
    },
    code: [
      {
        label: 'Set the connection URL',
        lang: 'bash',
        code: `${proxyUrlExport('mbl', 'de', 'auto10')}

# Swap the country token (de -> fr, es, gb ...) to move market.
# Nothing else in your code changes.`,
      },
      {
        label: 'Python — a polite, resilient price collector',
        lang: 'python',
        code: `import os, time, random
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

PROXY = os.environ["PROXY_URL"]

session = requests.Session()
session.proxies = {"http": PROXY, "https": PROXY}
session.headers["User-Agent"] = (
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36"
)

# Back off on 429/5xx and honour Retry-After rather than hammering.
retry = Retry(
    total=4,
    backoff_factor=1.5,
    status_forcelist=(429, 500, 502, 503, 504),
    respect_retry_after_header=True,
    allowed_methods=frozenset(["GET"]),
)
session.mount("https://", HTTPAdapter(max_retries=retry, pool_maxsize=20))

def fetch_price(url: str) -> str:
    r = session.get(url, timeout=30)
    r.raise_for_status()
    # Guard against the silent-staleness failure: if the page did not come
    # back in the currency you expect, treat it as a miss, not a price.
    if "€" not in r.text:
        raise ValueError(f"unexpected currency for DE exit: {url}")
    return r.text

for url in ["https://shop.example/p/1", "https://shop.example/p/2"]:
    html = fetch_price(url)
    print(len(html), url)
    time.sleep(random.uniform(1.5, 4.0))   # pace yourself`,
        note: 'The currency assertion is the important line. It converts the expensive silent failure into a visible one.',
      },
      {
        label: 'Python — session-scoped checks that need a cart',
        lang: 'python',
        code: `# Shipping cost and tax often only appear once an item is in a basket,
# which means the whole flow must run on one IP. Use a sticky session:
#   ...-mbl-de-sid-basket01-rot-sticky:PAK_KEY@...
import os, requests

s = requests.Session()
s.proxies = {"http": os.environ["PROXY_URL"], "https": os.environ["PROXY_URL"]}

s.post("https://shop.example/cart/add", data={"sku": "ABC", "qty": 1}, timeout=30)
quote = s.get("https://shop.example/cart/shipping", timeout=30).json()
print(quote["currency"], quote["total"], quote["eta_days"])`,
        note: 'One -sid- per concurrent basket. Reusing a sid across two workers puts them in the same cart.',
      },
    ],
    rotation: {
      mode: 'auto10',
      token: '-rot-auto10',
      why:
        'Catalogue sweeps are the classic rotation workload: many independent reads, no state to preserve between them, and a per-IP request budget you do not want to exhaust. auto10 gives you a fresh carrier IP roughly every ten minutes, which spreads a long crawl across many exits without you having to orchestrate anything. Pair it with real pacing — a second or two of jitter between requests — because rotation buys you headroom, not permission to run flat out.',
      alternatives: [
        { mode: 'sticky', when: 'Anything that spans requests: adding to a basket to reveal shipping cost, a logged-in trade price, a multi-step checkout quote. Use one -sid- per concurrent worker.' },
        { mode: 'auto30', when: 'Low-frequency monitoring — a daily or hourly sweep of a few hundred SKUs — where a slower churn is plenty.' },
        { mode: 'hard', when: 'You need the device pinned for a long-running session and want the strictest guarantee the pool offers.' },
      ],
    },
    bandwidth: {
      lead:
        'Price monitoring is cheap if you fetch HTML and expensive if you render. The single biggest lever on your bill is whether you drive a browser or not — and for most retail sites, you do not have to.',
      rows: [
        { workload: 'Product page, HTML only (requests/httpx)', perUnit: '150–400 KB', perGb: '~2,600–7,000 pages' },
        { workload: 'Category/listing page, HTML only', perUnit: '300–700 KB', perGb: '~1,500–3,500 pages' },
        { workload: 'Internal pricing JSON/GraphQL endpoint', perUnit: '5–40 KB', perGb: '~26,000–200,000 calls' },
        { workload: 'Full browser render of a JS-heavy PDP', perUnit: '2–5 MB', perGb: '~200–520 pages' },
      ],
      tip:
        'Before building a browser-based scraper, open the network tab and look for the JSON endpoint the page itself calls for price and stock. Most modern storefronts have one, and hitting it directly is between fifty and two hundred times cheaper per read than rendering the page around it. Figures above are typical ranges from real retail targets — meter your own before sizing a monthly budget.',
    },
    countries: [
      { slug: 'germany', why: 'Europe\'s largest e-commerce market, with VAT-inclusive display pricing that differs structurally from US listings.' },
      { slug: 'uk', why: 'Post-Brexit duty and shipping rules make UK quotes diverge from EU ones for the identical SKU.' },
      { slug: 'france', why: 'Local marketplaces and price-comparison rules that do not surface from a non-FR exit.' },
      { slug: 'usa', why: 'State-level tax and shipping variation, plus the most aggressive bot management on large retail estates.' },
      { slug: 'spain', why: 'Distinct regional pricing and promotional calendars from the rest of the EU.' },
      { slug: 'poland', why: 'Fast-growing marketplace sector with strong local players that geo-gate pricing to PL traffic.' },
      { slug: 'netherlands', why: 'Small market, high cross-border leakage — useful for spotting where a competitor prices differently to NL versus DE.' },
    ],
    legitimate: [
      'Collect prices that are published publicly. Do not authenticate into a trade or wholesale portal you have no account for.',
      'Respect robots directives and any documented crawl-rate guidance on your targets.',
      'Cache aggressively and re-fetch only what actually changes. Re-crawling a static catalogue nightly is cost you pay and load someone else absorbs.',
      'Personal data attached to listings — seller names, reviewer identities — is out of scope for pricing work. Do not collect it incidentally.',
    ],
    faqs: [
      {
        q: 'Why do I get stale or wrong-region prices from a datacentre proxy?',
        a: 'Because the site geolocates and classifies the IP before rendering. Cloud ranges commonly receive a cached default-region page, a logged-out price, or a soft block that still returns HTTP 200. Your parser cannot tell the difference, which is why the failure shows up as bad data rather than as an error.',
      },
      {
        q: 'Should I use a browser or plain HTTP requests?',
        a: 'Plain requests wherever the data is in the HTML or in a JSON endpoint the page calls — it is roughly ten to two hundred times cheaper per read. Reach for a browser only when the price genuinely requires client-side execution to appear.',
      },
      {
        q: 'How do I track shipping cost, which only appears at checkout?',
        a: 'Use a sticky session so the whole basket flow runs from one IP. Add -sid- with a per-worker identifier and -rot-sticky, then drive the add-to-cart and shipping-quote steps on that session.',
      },
      {
        q: 'How much bandwidth does a catalogue sweep use?',
        a: 'For HTML-only product pages, expect roughly 2,600 to 7,000 pages per gigabyte. If the site exposes a pricing JSON endpoint you can often get tens of thousands of reads from the same gigabyte.',
      },
      {
        q: 'Can I monitor a competitor\'s prices legally?',
        a: 'Collecting publicly displayed prices is common commercial practice in most jurisdictions, but the specifics depend on your location, the target\'s terms and how you use the data. We require that you stay within each target\'s terms and applicable law; we are not able to give you legal advice about your particular programme.',
      },
    ],
    related: ['mobile-proxies-for-serp-tracking', 'mobile-proxies-for-geo-testing', 'python-mobile-proxy'],
  },

  // ───────────────────────────────────────────── geo testing
  {
    slug: 'mobile-proxies-for-geo-testing',
    group: 'use-case',
    label: 'Geo testing & QA',
    title: 'Mobile Proxies for Geo-Testing — QA Your Localised Build In-Market | ProxyMobile',
    description:
      'Test localisation, currency, tax, consent banners and geo-gated content from real in-country carrier IPs. Playwright examples, sticky-session guidance, bandwidth maths. From $5/GB.',
    h1: 'Mobile proxies for geo-testing and regional QA',
    badge: 'Regional QA · Sticky sessions',
    intro:
      'Your localised build is a set of assumptions about what a user in another country sees: their currency, their tax treatment, their language, their consent banner, their payment methods, their CDN edge. Every one of those is decided by the request\'s apparent origin, which means the only honest way to test them is to make the request from inside the market. This is the use case where mobile proxies are least about evasion and most about simply being in the right place.',
    keywords: [
      'mobile proxies for geo testing',
      'geo testing proxy',
      'localisation QA proxy',
      'geo restricted content testing',
      'regional qa mobile proxy',
      'test website from another country',
    ],
    problem: {
      heading: 'The problem: you cannot QA a market you cannot reach',
      body:
        'Consumer VPNs are the usual first attempt, and they fail for a specific reason: their exit ranges are published and widely blocked, so the very geo-gating you are trying to test often refuses the VPN outright. Cloud egress fails differently — it resolves to a different CDN edge and a different geo-IP classification than any real subscriber, so you end up testing a code path no customer will ever hit. A carrier IP in the target country is simply a normal user from the application\'s point of view, which is exactly what a QA environment should be.',
      symptoms: [
        'A currency or tax bug that only reproduces for customers, never for QA.',
        'Consent banners that behave differently in production than in your test runs.',
        'Geo-gated content or store variants you cannot see to sign off on.',
        'A CDN edge serving stale assets in one region, invisible from head office.',
        'Payment method availability that differs by country and cannot be verified pre-release.',
        'Support tickets you have to close as "cannot reproduce" because you are in the wrong country.',
      ],
    },
    code: [
      {
        label: 'Set the connection URL',
        lang: 'bash',
        code: `${proxyUrlExport('mbl', 'fr', 'sticky', 'qa-fr-01')}

# Sticky + a stable -sid- keeps the whole test session on one device,
# so the country cannot flip halfway through a checkout flow.`,
      },
      {
        label: 'Playwright — assert the localisation, do not eyeball it',
        lang: 'javascript',
        code: `import { chromium, devices } from 'playwright';
import { expect } from '@playwright/test';

const url = new URL(process.env.PROXY_URL);

const browser = await chromium.launch({
  proxy: {
    server: \`http://\${url.host}\`,
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  },
});

// Match the locale and timezone to the exit country, or you are testing
// a combination (FR IP, en-US browser) that almost no real user has.
const context = await browser.newContext({
  ...devices['Pixel 7'],
  locale: 'fr-FR',
  timezoneId: 'Europe/Paris',
  geolocation: { latitude: 48.8566, longitude: 2.3522 },
  permissions: ['geolocation'],
});

const page = await context.newPage();
await page.goto('https://your-app.example/pricing');

await expect(page.getByTestId('price')).toContainText('€');
await expect(page.getByTestId('vat-note')).toContainText('TVA');
await expect(page.locator('#cmp-banner')).toBeVisible();   // GDPR consent

await page.screenshot({ path: 'fr-pricing.png', fullPage: true });
await browser.close();`,
        note: 'Setting locale and timezone alongside the proxy is what makes this a realistic French user rather than a French IP with an American browser.',
      },
      {
        label: 'Run the same suite across every market',
        lang: 'javascript',
        code: `// playwright.config.js — one project per market, same specs.
const markets = [
  { name: 'fr', country: 'fr', locale: 'fr-FR', tz: 'Europe/Paris' },
  { name: 'de', country: 'de', locale: 'de-DE', tz: 'Europe/Berlin' },
  { name: 'gb', country: 'gb', locale: 'en-GB', tz: 'Europe/London' },
  { name: 'us', country: 'us', locale: 'en-US', tz: 'America/New_York' },
];

const proxyFor = (country, sid) => {
  const u = new URL(process.env.PROXY_URL);
  // Rewrite only the country and sid tokens; everything else is unchanged.
  const user = decodeURIComponent(u.username)
    .replace(/-(?:us|gb|de|fr|es|nl|pl|ch|pa|am|ge)-/, \`-\${country}-\`)
    .replace(/-sid-[a-z0-9_]+/, \`-sid-\${sid}\`);
  return {
    server: \`http://\${u.host}\`,
    username: user,
    password: decodeURIComponent(u.password),
  };
};

export default {
  projects: markets.map((m) => ({
    name: m.name,
    use: {
      proxy: proxyFor(m.country, \`qa-\${m.name}\`),
      locale: m.locale,
      timezoneId: m.tz,
    },
  })),
};`,
        note: 'The whole market matrix is a string rewrite. No per-country infrastructure, no VPN profiles to maintain.',
      },
    ],
    rotation: {
      mode: 'sticky',
      token: '-rot-sticky',
      why:
        'Geo-testing is the one workload on this site where you want the IP to stay exactly where it is. A test session is stateful — cookies, a consent decision, a cart, a login, a payment flow — and an IP that rotates mid-run will either log you out or, worse, quietly re-evaluate your country between steps and give you a result that does not correspond to any real user journey. Pin the session with -rot-sticky and a stable -sid-, one per concurrent test worker, and the exit stays put for the duration.',
      alternatives: [
        { mode: 'hard', when: 'Long-running suites where you want the strictest device pin the pool offers.' },
        { mode: 'auto10', when: 'Only for stateless spot checks — "does this URL redirect correctly from Poland" — where nothing carries between requests.' },
        { mode: 'none', when: 'Not recommended for QA. Leaving rotation to the gateway default makes a failing test hard to attribute.' },
      ],
    },
    bandwidth: {
      lead:
        'QA runs render real pages in a real browser, so budget like a browser. The good news is that test suites are usually small in absolute terms — you are running tens or hundreds of journeys, not millions of fetches.',
      rows: [
        { workload: 'Single page load, full assets, cold cache', perUnit: '2–5 MB', perGb: '~200–520 loads' },
        { workload: 'Complete checkout journey (5–8 steps)', perUnit: '6–15 MB', perGb: '~70–170 journeys' },
        { workload: 'Page load with images/fonts/media blocked', perUnit: '300–700 KB', perGb: '~1,500–3,500 loads' },
        { workload: 'Redirect/header spot check (no render)', perUnit: '~5 KB', perGb: '~200,000 checks' },
      ],
      tip:
        'Reuse one browser context across the assertions in a journey instead of launching per test — a warm cache removes most of the repeat asset cost. And run the full-asset suite on a schedule while your per-commit CI run uses the asset-blocked variant; most localisation assertions are about text and headers, which do not need the images. Ranges above assume typical commercial web apps; meter your own suite before sizing.',
    },
    countries: [
      { slug: 'germany', why: 'The strictest consent-banner behaviour in the EU, and VAT-inclusive pricing that frequently breaks US-built checkout flows.' },
      { slug: 'france', why: 'Language, currency and TVA handling, plus local payment methods that only appear to FR traffic.' },
      { slug: 'uk', why: 'Separate duty, VAT and consent regime from the EU since Brexit — a distinct code path that needs its own sign-off.' },
      { slug: 'usa', why: 'State-level tax logic and the largest set of region-specific content rules in most products.' },
      { slug: 'switzerland', why: 'Non-EU, multilingual and its own currency — reliably the market that finds hardcoded assumptions in a localisation layer.' },
      { slug: 'poland', why: 'Local payment methods and a currency that is neither EUR nor USD, a common source of rounding and formatting bugs.' },
      { slug: 'netherlands', why: 'High English-proficiency market where language negotiation often misfires, serving EN to users expecting NL.' },
    ],
    legitimate: [
      'Test applications you own, or that a client has authorised you in writing to test.',
      'Geo-testing is for verifying your own regional behaviour — not for consuming a third party\'s geo-licensed media outside its licensed territory.',
      'Keep synthetic test traffic out of your production analytics, and do not place real orders you will not honour.',
      'If your suite touches a payment provider, use their sandbox. Driving live payment rails with test traffic is a compliance problem regardless of the proxy.',
    ],
    faqs: [
      {
        q: 'Why not use a VPN for geo-testing?',
        a: 'Consumer VPN exit ranges are published and widely blocked, so the geo-gating you are trying to test frequently refuses the VPN outright — you learn that the site blocks VPNs, not whether your localisation works. A carrier IP looks like an ordinary subscriber, so the application takes the normal code path.',
      },
      {
        q: 'Which rotation mode for a test suite?',
        a: 'Sticky, with a stable -sid- per worker. Test journeys are stateful; an IP that changes mid-journey can log the session out or re-evaluate the country between steps, producing failures that have nothing to do with your build.',
      },
      {
        q: 'Can I run this from CI?',
        a: 'Yes. It is one proxy setting in your Playwright, Puppeteer or Selenium config, so it works the same in CI as locally. Give each parallel worker its own -sid- so they do not share a device.',
      },
      {
        q: 'Do I need to set locale and timezone too?',
        a: 'You should. An FR exit IP with an en-US browser and a New York timezone is a combination almost no real user has, and it will exercise a different code path than the customer you are trying to emulate. Set all three together.',
      },
      {
        q: 'How much bandwidth does a QA suite need?',
        a: 'A full checkout journey with all assets runs roughly 6–15 MB, so about 70–170 journeys per gigabyte. Blocking images and fonts gets you several times more, and most localisation assertions are about text and headers anyway.',
      },
    ],
    related: ['mobile-proxies-for-ad-verification', 'playwright-mobile-proxy', 'puppeteer-mobile-proxy'],
  },

  // ───────────────────────────────────────────── SERP tracking
  {
    slug: 'mobile-proxies-for-serp-tracking',
    group: 'use-case',
    label: 'SERP tracking',
    title: 'Mobile Proxies for SERP Tracking — Rankings a Real Mobile User Sees | ProxyMobile',
    description:
      'Track search rankings from real in-country 4G/5G carrier IPs on the mobile index. Python examples, rotation guidance, bandwidth maths and country coverage. Pay per GB from $5.',
    h1: 'Mobile proxies for SERP and rank tracking',
    badge: 'Rank tracking · Mobile index',
    intro:
      'Search results are assembled per request from country, device class, and whatever the engine infers about the client. A rank measured from a cloud IP in another country is not a noisy version of the real ranking — it is a different question being answered. If you report mobile rankings for a local market, the measurement has to come from a mobile IP in that market.',
    keywords: [
      'mobile proxies for serp tracking',
      'rank tracking proxy',
      'serp scraping proxy',
      'google rank checker proxy',
      'mobile serp tracking',
      'local seo rank tracking proxy',
    ],
    problem: {
      heading: 'The problem: you are measuring a SERP nobody sees',
      body:
        'Two distortions compound. First, geography: search engines localise results heavily, so a query run from the wrong country returns a ranking no user in your target market experiences. Second, device class: the mobile index and the desktop index genuinely differ, and since most commercial search traffic is mobile, a desktop-shaped measurement misstates the rankings that actually drive your revenue. On top of both, sustained automated querying from datacentre ranges attracts interstitials and captchas, which turns a rank tracker into a captcha-solving budget.',
      symptoms: [
        'Reported ranks that do not match what clients see on their phones.',
        'Captcha and "unusual traffic" interstitials that grow as your keyword set grows.',
        'Local-pack and map results missing entirely from your captures.',
        'Rankings that shift when you change hosting provider — a sure sign you are measuring your infrastructure, not the index.',
        'Desktop and mobile ranks reported as identical, which is almost never true.',
      ],
    },
    code: [
      {
        label: 'Set the connection URL',
        lang: 'bash',
        code: `${proxyUrlExport('mbl', 'gb', 'auto10', 'serp01')}

# Country token = the market you report rankings for.
# Vary -sid- across workers so queries spread over many devices.`,
      },
      {
        label: 'Python — a paced rank check on the mobile index',
        lang: 'python',
        code: `import os, time, random, urllib.parse
import requests

PROXY = os.environ["PROXY_URL"]

MOBILE_UA = (
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36"
)

def serp(query: str, gl: str = "gb", hl: str = "en") -> str:
    params = urllib.parse.urlencode({"q": query, "gl": gl, "hl": hl, "num": 20})
    r = requests.get(
        f"https://www.google.com/search?{params}",
        headers={"User-Agent": MOBILE_UA, "Accept-Language": f"{hl},en;q=0.8"},
        proxies={"http": PROXY, "https": PROXY},
        timeout=45,
    )
    # An interstitial is not a ranking. Fail loudly instead of parsing it.
    if r.status_code == 429 or "/sorry/" in r.url:
        raise RuntimeError("rate limited — slow down and let the IP rotate")
    r.raise_for_status()
    return r.text

for kw in ["mobile proxy", "4g proxy uk", "rotating proxy api"]:
    html = serp(kw)
    print(f"{len(html):>7} bytes  {kw}")
    time.sleep(random.uniform(8, 20))   # realistic human cadence`,
        note: 'The pacing is not decoration. A rank tracker that queries faster than a person can type is the one that gets throttled.',
      },
      {
        label: 'Spread a keyword set across sessions',
        lang: 'python',
        code: `import os, re

def proxy_for_worker(worker_id: int) -> str:
    """Give each worker its own device by rewriting the -sid- token."""
    base = os.environ["PROXY_URL"]
    return re.sub(r"-sid-[a-z0-9_]+", f"-sid-serp{worker_id:02d}", base)

# 4 workers, 4 devices, each pacing itself independently.
for w in range(4):
    print(proxy_for_worker(w))`,
        note: 'Distinct sids mean distinct devices, so four slow workers beat one fast one.',
      },
    ],
    rotation: {
      mode: 'auto10',
      token: '-rot-auto10',
      why:
        'Rank tracking wants many independent queries and keeps no state between them, which is exactly what timed rotation is for. auto10 hands you a fresh carrier IP roughly every ten minutes so a long keyword run is spread across many exits rather than concentrated on one. The rotation is not a licence to go fast, though: pair it with genuine pacing of several seconds between queries and split the keyword set across several -sid- values so the load is shared across devices instead of stacked on one.',
      alternatives: [
        { mode: 'auto30', when: 'Daily or weekly tracking of a modest keyword set, where a slower churn is more than enough.' },
        { mode: 'sticky', when: 'Rarely useful here. Only if you are deliberately measuring how results evolve for one persistent client.' },
        { mode: 'hard', when: 'Not recommended for SERP work — pinning one device concentrates all your query volume on a single IP.' },
      ],
    },
    bandwidth: {
      lead:
        'SERP tracking is one of the cheapest workloads on the pool, provided you fetch the results HTML rather than rendering the page. Rank data lives in the markup.',
      rows: [
        { workload: 'Search results page, HTML only', perUnit: '250–450 KB', perGb: '~2,300–4,200 queries' },
        { workload: 'Results page with local pack / rich results', perUnit: '400–700 KB', perGb: '~1,500–2,600 queries' },
        { workload: 'Full browser render of a SERP', perUnit: '2–4 MB', perGb: '~260–520 queries' },
        { workload: 'Cached-result revalidation (conditional GET)', perUnit: '~1 KB', perGb: 'effectively free' },
      ],
      tip:
        'A thousand keywords tracked daily on HTML-only fetches is roughly 8–13 GB a month — worth modelling before you commit, because it is usually cheaper than a per-query rank-tracking API at that volume. Track daily rather than hourly unless you genuinely act on intraday movement; most ranking decisions are made on weekly trends, and the extra frequency is bandwidth you spend for noise.',
    },
    countries: [
      { slug: 'uk', why: 'Distinct index from the US with its own local pack behaviour; the default market for most English-language tracking that is not US.' },
      { slug: 'usa', why: 'The largest and most contested index, and the one where automated querying is policed hardest.' },
      { slug: 'germany', why: 'Strong local-language results where the ranking set barely overlaps the English one for the same intent.' },
      { slug: 'france', why: 'Local-language index with its own competitive set; results from a non-FR exit are close to meaningless.' },
      { slug: 'spain', why: 'Frequently split-tracked against LatAm markets for the same Spanish-language keywords.' },
      { slug: 'poland', why: 'Local-language market where in-country measurement matters more than for pan-European English terms.' },
      { slug: 'netherlands', why: 'Mixed NL/EN result sets make exit geography unusually decisive for what ranks.' },
    ],
    legitimate: [
      'Track rankings for properties you own or that a client has engaged you to report on.',
      'Honour each search engine\'s terms of service and rate expectations — several publish an API for exactly this purpose, and it is often the right tool.',
      'Pace your queries to a human cadence. Volume that degrades a service for its users is not something bandwidth entitles you to.',
      'Do not collect or store personal data that appears incidentally in results.',
    ],
    faqs: [
      {
        q: 'Why do mobile proxies matter for rank tracking specifically?',
        a: 'Because the mobile index differs from the desktop one, and most commercial search traffic is mobile. Measuring from a desktop-shaped datacentre connection reports a ranking that does not correspond to where your revenue actually comes from.',
      },
      {
        q: 'Will this stop captchas entirely?',
        a: 'No, and you should be sceptical of anyone who says otherwise. Carrier IPs materially reduce interstitial rates compared with datacentre ranges, but querying faster than a human plausibly would will still get throttled. Pacing matters at least as much as the IP.',
      },
      {
        q: 'How much bandwidth does a thousand keywords cost?',
        a: 'Tracked once daily on HTML-only fetches, roughly 8–13 GB per month. Rendering each SERP in a browser instead multiplies that by about eight, which is almost never worth it since the ranking data is in the markup.',
      },
      {
        q: 'Which rotation mode should I use?',
        a: 'auto10, split across several -sid- values so the query load spreads over multiple devices. Sticky and hard concentrate everything on one IP, which is the opposite of what a large keyword set needs.',
      },
      {
        q: 'Can I track local-pack and map results?',
        a: 'Results that depend on locality are exactly the ones that need an in-country exit, so this is where a carrier IP in the target market helps most. Expect somewhat heavier pages when rich results are present.',
      },
    ],
    related: ['mobile-proxies-for-price-monitoring', 'mobile-proxies-for-ad-verification', 'python-mobile-proxy'],
  },

  // ───────────────────────────────────────────── playwright
  {
    slug: 'playwright-mobile-proxy',
    group: 'stack',
    label: 'Playwright',
    title: 'Playwright Mobile Proxy — Setup, Auth, Rotation and Bandwidth | ProxyMobile',
    description:
      'Use a 4G/5G mobile proxy with Playwright: launch and per-context proxy auth, one session per context, request blocking to cut bandwidth, and CI-ready config. From $5/GB.',
    h1: 'Playwright mobile proxy setup',
    badge: 'Playwright · Chromium, Firefox, WebKit',
    intro:
      'Playwright takes a proxy at launch and per browser context, which makes it the easiest of the automation frameworks to point at a mobile pool — once you know that credentials go in the proxy object rather than in the server URL. This page covers the setup that actually works, how to map sessions onto contexts, and how to keep a browser-driven workload from quietly costing you a fortune in bandwidth.',
    keywords: [
      'playwright mobile proxy',
      'playwright proxy authentication',
      'playwright 4g proxy',
      'playwright rotating proxy',
      'playwright proxy per context',
      'playwright scraping proxy',
    ],
    problem: {
      heading: 'The problem: cloud browsers get walled, and proxy auth is fiddly',
      body:
        'Two things bite in order. First, a headless browser running from CI or a cloud VM is transparently identifiable by IP alone — the entire range is known — so bot management engages before your selectors ever run, and you spend days tuning fingerprints that were never the problem. Second, when you do reach for a proxy, the obvious move of embedding credentials in the server URL does not work: Playwright expects them as separate username and password fields, and a malformed attempt fails with a connection error that says nothing useful about why.',
      symptoms: [
        'Selectors that work locally and time out in CI, against the same URL.',
        'net::ERR_TUNNEL_CONNECTION_FAILED or a hang at goto() after adding a proxy.',
        'Challenge pages, interstitials or empty shells instead of content.',
        'Bandwidth bills that scale with page weight because every asset loads.',
        'Parallel workers interfering with each other because they share one exit.',
      ],
    },
    code: [
      {
        label: 'Set the connection URL',
        lang: 'bash',
        code: `${proxyUrlExport('mbl', 'us', 'sticky', 'pw01')}

# One -sid- per browser context. Parallel workers need distinct sids.`,
      },
      {
        label: 'Launch-level proxy (the correct auth shape)',
        lang: 'javascript',
        code: `import { chromium } from 'playwright';

const url = new URL(process.env.PROXY_URL);

const browser = await chromium.launch({
  proxy: {
    // Host and port ONLY. Credentials do not go in this string.
    server: \`http://\${url.host}\`,
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  },
});

const page = await browser.newPage();
await page.goto('https://api.ipify.org?format=json');
console.log(await page.textContent('body'));   // your carrier exit IP

await browser.close();`,
        note: 'decodeURIComponent matters: the username contains hyphenated tokens and the key may be percent-encoded.',
      },
      {
        label: 'Per-context proxies — many sessions, one browser',
        lang: 'javascript',
        code: `import { chromium } from 'playwright';

const base = new URL(process.env.PROXY_URL);

function proxyForSession(sid) {
  return {
    server: \`http://\${base.host}\`,
    username: decodeURIComponent(base.username).replace(/-sid-[a-z0-9_]+/, \`-sid-\${sid}\`),
    password: decodeURIComponent(base.password),
  };
}

// Launch once; give each context its own device via its own sid.
const browser = await chromium.launch();

const sids = ['job-a', 'job-b', 'job-c'];
const contexts = await Promise.all(
  sids.map((sid) => browser.newContext({ proxy: proxyForSession(sid) })),
);

for (const [i, ctx] of contexts.entries()) {
  const page = await ctx.newPage();
  await page.goto('https://api.ipify.org?format=json');
  console.log(sids[i], await page.textContent('body'));
}

await browser.close();`,
        note: 'One context per session is the right mental model: contexts isolate cookies and storage, sids isolate devices.',
      },
      {
        label: 'Cut bandwidth by 70–80% with route blocking',
        lang: 'javascript',
        code: `const context = await browser.newContext({ proxy: proxyForSession('job-a') });

// You pay per gigabyte, so do not download what you will not assert on.
await context.route('**/*', (route) => {
  const type = route.request().resourceType();
  if (['image', 'media', 'font', 'stylesheet'].includes(type)) {
    return route.abort();
  }
  return route.continue();
});

const page = await context.newPage();
await page.goto('https://target.example/product/123', { waitUntil: 'domcontentloaded' });
console.log(await page.textContent('[data-testid="price"]'));`,
        note: 'Drop stylesheet from the list if you assert on computed layout or take screenshots.',
      },
    ],
    rotation: {
      mode: 'sticky',
      token: '-rot-sticky',
      why:
        'A browser context is a session: it carries cookies, local storage and usually a login. If the exit IP changes underneath it, the site sees a session that teleported and will frequently invalidate it — which surfaces as a flaky test or a mid-crawl logout rather than as an obvious proxy error. Pin each context with -rot-sticky and give it its own -sid-, so context lifetime and IP lifetime line up. When you want a new identity, make a new context with a new sid rather than rotating under the old one.',
      alternatives: [
        { mode: 'auto10', when: 'Stateless crawling where each page is independent and you are not carrying a session — a link-check sweep, say.' },
        { mode: 'hard', when: 'Long-lived contexts that must not move device at all, such as an hours-long monitoring session.' },
        { mode: 'auto30', when: 'Background crawls where a slow churn adds IP diversity without disrupting short sessions.' },
      ],
    },
    bandwidth: {
      lead:
        'Playwright downloads everything a real browser downloads, which is the point — and the cost. On a pay-per-GB pool, request interception is the single highest-leverage line of code in your script.',
      rows: [
        { workload: 'Typical page, all assets, cold cache', perUnit: '2–5 MB', perGb: '~200–520 pages' },
        { workload: 'Same page, images/media/fonts blocked', perUnit: '400–900 KB', perGb: '~1,150–2,600 pages' },
        { workload: 'Same page, warm context cache (repeat visit)', perUnit: '150–500 KB', perGb: '~2,000–7,000 pages' },
        { workload: 'API-only interception (block document too)', perUnit: '5–50 KB', perGb: '~20,000–200,000 calls' },
      ],
      tip:
        'Reuse contexts across navigations so the cache stays warm — launching a fresh browser per page re-downloads every asset and is the most common reason a Playwright bill comes in several times over estimate. Combine a warm context with route blocking and a browser workload lands within a small multiple of plain HTTP fetching. Figures are typical ranges for commercial sites; meter your own targets.',
    },
    countries: [
      { slug: 'usa', why: 'Default market for most automation work, and where bot management is most aggressive against cloud egress.' },
      { slug: 'uk', why: 'Common second market for English-language automation, with its own content and consent behaviour.' },
      { slug: 'germany', why: 'Consent flows that only appear to EU traffic — a frequent source of "works locally, fails in CI" selector breakage.' },
      { slug: 'france', why: 'Local-language rendering paths that CI in a US region will never exercise.' },
      { slug: 'netherlands', why: 'Low-latency European exit, useful when you want EU geography without German consent complexity.' },
      { slug: 'poland', why: 'Cost-effective EU exit with good pool depth for longer-running crawls.' },
    ],
    legitimate: [
      'Automate sites you own, or that you are authorised to test or collect from.',
      'Respect robots directives and rate limits — a headless browser can generate load far faster than a person, and that is your responsibility to throttle.',
      'Do not use automation to create accounts at scale, defeat a captcha you were not meant to pass, or bypass an access control.',
      'Identify your automation honestly where a target asks you to, and honour Retry-After when you get it.',
    ],
    faqs: [
      {
        q: 'Why does my Playwright proxy connection fail with credentials in the URL?',
        a: 'Because Playwright expects them separately. The server field takes host and port only — put the credentials in the username and password fields of the proxy object, and run them through decodeURIComponent first since the connection URL is percent-encoded.',
      },
      {
        q: 'Can I use a different proxy per browser context?',
        a: 'Yes, and it is the recommended pattern. Pass a proxy to newContext() and rewrite the -sid- token per context, so each context gets its own device while you still launch the browser only once.',
      },
      {
        q: 'Sticky or rotating for Playwright?',
        a: 'Sticky, in almost all cases. A context holds cookies and a login, so an IP that rotates underneath it makes the session look like it teleported and gets it invalidated. Create a new context with a new sid when you want a new identity.',
      },
      {
        q: 'How do I keep a browser workload from burning bandwidth?',
        a: 'Block images, media and fonts with context.route(), and reuse contexts so the cache stays warm. Together those typically cut a run by 70–80%, which puts a browser workload within a small multiple of plain HTTP fetching.',
      },
      {
        q: 'Does this work in CI and with playwright.config?',
        a: 'Yes. The proxy is a normal config value, so you can set it per project in playwright.config and run the same specs against several markets. Give each parallel worker a distinct -sid- so workers do not share a device.',
      },
      {
        q: 'Does it work with Firefox and WebKit too?',
        a: 'Yes. The proxy option is part of Playwright\'s common launch and context API rather than a Chromium-specific feature, so the same configuration applies across all three browser engines.',
      },
    ],
    related: ['puppeteer-mobile-proxy', 'mobile-proxies-for-geo-testing', 'mobile-proxies-for-ad-verification'],
  },

  // ───────────────────────────────────────────── python
  {
    slug: 'python-mobile-proxy',
    group: 'stack',
    label: 'Python',
    title: 'Python Mobile Proxy — requests, httpx and aiohttp Setup | ProxyMobile',
    description:
      'Use a 4G/5G mobile proxy from Python: requests, httpx and aiohttp examples, session reuse, retries, rotation choice and bandwidth maths. Pay per GB from $5, no SDK.',
    h1: 'Python mobile proxy setup',
    badge: 'Python · requests, httpx, aiohttp',
    intro:
      'Every mainstream Python HTTP client already supports proxies, so there is nothing to install and no vendor SDK to learn — the integration is one environment variable and one argument. What is worth getting right is the part underneath: reusing connections, retrying properly, and asserting that your exit is where you think it is before a long job commits to bad data.',
    keywords: [
      'python mobile proxy',
      'python requests proxy',
      'httpx proxy',
      'aiohttp proxy',
      'python 4g proxy',
      'python rotating proxy',
      'python scraping proxy',
    ],
    problem: {
      heading: 'The problem: the easy part is easy, the durable part is not',
      body:
        'Pointing requests at a proxy takes one line, and that line is where most guides stop. The failures show up later: a new TCP connection and a new CONNECT tunnel for every call because the code used requests.get instead of a Session, so a job runs several times slower than it should; a retry loop that hammers a 429 instead of honouring Retry-After; an async client that opens hundreds of concurrent tunnels and is treated as an attack. None of these look like proxy problems in the traceback, which is exactly why they cost so much time.',
      symptoms: [
        'Throughput far below what the connection should support, with most time in connection setup.',
        'ProxyError or TunnelError under concurrency that vanishes when you run single-threaded.',
        'SSL errors after adding the proxy, usually from trying to verify against the proxy rather than the target.',
        'Escalating 429s because the retry policy backs off too little, or not at all.',
        'A completed job full of wrong-region data because nothing asserted the exit country.',
      ],
    },
    code: [
      {
        label: 'Set the connection URL',
        lang: 'bash',
        code: `${proxyUrlExport('mbl', 'us', 'auto10')}

# Same string works for http:// and https:// targets — the client
# issues a CONNECT tunnel for TLS automatically.`,
      },
      {
        label: 'requests — a Session you can run all day',
        lang: 'python',
        code: `import os
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

PROXY = os.environ["PROXY_URL"]

session = requests.Session()
session.proxies = {"http": PROXY, "https": PROXY}

retry = Retry(
    total=4,
    backoff_factor=1.5,                    # 1.5s, 3s, 6s, 12s
    status_forcelist=(429, 500, 502, 503, 504),
    respect_retry_after_header=True,
    allowed_methods=frozenset(["GET", "HEAD"]),
)
# pool_maxsize keeps tunnels alive instead of reconnecting per request.
session.mount("https://", HTTPAdapter(max_retries=retry, pool_maxsize=20))
session.mount("http://", HTTPAdapter(max_retries=retry, pool_maxsize=20))

# Assert the exit before the job commits to anything.
who = session.get("https://ipinfo.io/json", timeout=30).json()
print(f"exit {who['ip']} — {who['country']} — {who['org']}")

r = session.get("https://example.com", timeout=30)
print(r.status_code, len(r.content))`,
        note: 'Session plus pool_maxsize is the difference between one tunnel reused and one tunnel per request.',
      },
      {
        label: 'httpx — sync and async from the same config',
        lang: 'python',
        code: `import os, asyncio, httpx

PROXY = os.environ["PROXY_URL"]

# Sync
with httpx.Client(proxy=PROXY, timeout=30.0) as client:
    print(client.get("https://api.ipify.org?format=json").json())

# Async — bound concurrency, or you will open a tunnel per task.
async def main(urls):
    limits = httpx.Limits(max_connections=10, max_keepalive_connections=10)
    sem = asyncio.Semaphore(10)
    async with httpx.AsyncClient(proxy=PROXY, limits=limits, timeout=30.0) as c:
        async def one(u):
            async with sem:
                r = await c.get(u)
                return u, r.status_code, len(r.content)
        return await asyncio.gather(*(one(u) for u in urls))

print(asyncio.run(main(["https://example.com"] * 5)))`,
        note: 'httpx 0.26+ takes proxy=; older versions used proxies=. Bound concurrency explicitly — unbounded async is what gets a client rate-limited.',
      },
      {
        label: 'aiohttp — proxy goes per request',
        lang: 'python',
        code: `import os, asyncio, aiohttp

PROXY = os.environ["PROXY_URL"]

async def main():
    conn = aiohttp.TCPConnector(limit=10)
    async with aiohttp.ClientSession(connector=conn) as s:
        # aiohttp takes proxy= on the call, not on the session.
        async with s.get("https://api.ipify.org?format=json", proxy=PROXY) as r:
            print(r.status, await r.json())

asyncio.run(main())`,
        note: 'A common gotcha: setting proxy on ClientSession does nothing — it belongs on each request.',
      },
      {
        label: 'Rotate country or session without touching your code',
        lang: 'python',
        code: `import os, re

def with_country(url: str, cc: str) -> str:
    return re.sub(r"-(us|gb|de|fr|es|nl|pl|ch|pa|am|ge)-", f"-{cc}-", url, count=1)

def with_session(url: str, sid: str) -> str:
    if "-sid-" in url:
        return re.sub(r"-sid-[a-z0-9_]+", f"-sid-{sid}", url)
    return url.replace("-rot-", f"-sid-{sid}-rot-")

base = os.environ["PROXY_URL"]
print(with_country(base, "de"))
print(with_session(with_country(base, "fr"), "worker07"))`,
        note: 'Routing lives in the username string, so switching market is a substitution — not a redeploy.',
      },
    ],
    rotation: {
      mode: 'auto10',
      token: '-rot-auto10',
      why:
        'For the common Python workload — a crawl of many independent URLs with no session to preserve — auto10 is the right default. You get a fresh carrier IP roughly every ten minutes without any orchestration on your side, which spreads a long job across many exits. Keep using one requests.Session across the rotation: the session is your connection pool and cookie jar, and it is unaffected by the exit changing between requests.',
      alternatives: [
        { mode: 'sticky', when: 'Anything stateful — a logged-in account, a multi-step form, a cart. Add -sid- with one identifier per worker.' },
        { mode: 'auto30', when: 'Long background jobs where a slower churn is enough and you would rather keep tunnels alive longer.' },
        { mode: 'none', when: 'Quick one-off scripts where you do not care what the exit does between calls.' },
      ],
    },
    bandwidth: {
      lead:
        'Plain HTTP from Python is the cheapest way to use the pool, because you download exactly what you ask for and nothing else. This is the workload where a gigabyte goes a very long way.',
      rows: [
        { workload: 'HTML page fetch (typical content site)', perUnit: '100–400 KB', perGb: '~2,600–10,000 pages' },
        { workload: 'JSON API response', perUnit: '2–50 KB', perGb: '~20,000–500,000 calls' },
        { workload: 'HTML with gzip/brotli negotiated', perUnit: '30–120 KB', perGb: '~8,700–35,000 pages' },
        { workload: 'HEAD request / status check', perUnit: '~1 KB', perGb: 'effectively free' },
      ],
      tip:
        'Send Accept-Encoding: gzip, br — requests and httpx do by default, but hand-rolled headers often clobber it, and compression alone typically cuts HTML transfer by 70%. Use HEAD when you only need a status or a header, and stream large responses with stream=True so you can abort once you have what you need instead of paying for the tail. Ranges above are typical; meter your own targets before sizing.',
    },
    countries: [
      { slug: 'usa', why: 'Default exit for most Python scraping work and the largest pool.' },
      { slug: 'uk', why: 'English-language targets with distinct content and regulatory behaviour from the US.' },
      { slug: 'germany', why: 'Largest EU market; consent and VAT logic that only appears to EU exits.' },
      { slug: 'france', why: 'Local-language targets where a non-FR exit returns a different page entirely.' },
      { slug: 'netherlands', why: 'Fast, stable European exit — a good default when you need EU geography generically.' },
      { slug: 'poland', why: 'Good pool depth for sustained long-running jobs.' },
      { slug: 'georgia', why: 'Useful regional exit for targets that treat Caucasus traffic differently from Western Europe.' },
    ],
    legitimate: [
      'Collect from sites you own or are authorised to collect from, within their terms.',
      'Honour robots directives, Retry-After and any published rate guidance — your retry policy is part of your compliance posture, not just your reliability.',
      'Bound your concurrency. Unbounded async against one host is indistinguishable from an attack, whatever your intent.',
      'Do not harvest personal data without a lawful basis, and do not retain what you did not need to collect.',
    ],
    faqs: [
      {
        q: 'Do I need a special library or SDK?',
        a: 'No. requests, httpx, aiohttp, urllib3 and Scrapy all support standard HTTP proxies out of the box. You set one proxy URL and everything else in your code is unchanged.',
      },
      {
        q: 'Why is my scraper slow after adding a proxy?',
        a: 'Almost always because each call creates a new connection. Use one requests.Session (or one httpx.Client) for the whole job and raise pool_maxsize, so the CONNECT tunnel is established once and reused instead of per request.',
      },
      {
        q: 'How do I use HTTPS through the proxy?',
        a: 'The same URL works for both schemes — the client issues a CONNECT tunnel automatically for TLS targets. Keep certificate verification on; it validates the target\'s certificate, not the proxy, so there is no reason to disable it.',
      },
      {
        q: 'What is the difference between proxy= and proxies= in httpx?',
        a: 'httpx 0.26 and later take a single proxy= argument; earlier versions used a proxies= mapping. If you get an unexpected keyword argument error, check your installed version against the one your example was written for.',
      },
      {
        q: 'Why does setting proxy on an aiohttp ClientSession do nothing?',
        a: 'Because aiohttp takes the proxy per request rather than per session. Pass proxy=PROXY to each .get() or .post() call, as in the example above.',
      },
      {
        q: 'Which rotation mode for a Python crawl?',
        a: 'auto10 for stateless crawls of many independent URLs. Switch to sticky with a per-worker -sid- as soon as you carry a login, a cart or any other state between requests.',
      },
    ],
    related: ['playwright-mobile-proxy', 'mobile-proxies-for-price-monitoring', 'mobile-proxies-for-serp-tracking'],
  },

  // ───────────────────────────────────────────── puppeteer
  {
    slug: 'puppeteer-mobile-proxy',
    group: 'stack',
    label: 'Puppeteer',
    title: 'Puppeteer Mobile Proxy — Authentication, Rotation and Bandwidth | ProxyMobile',
    description:
      'Use a 4G/5G mobile proxy with Puppeteer: --proxy-server plus page.authenticate, one browser per session, request interception to cut bandwidth, and CI setup. From $5/GB.',
    h1: 'Puppeteer mobile proxy setup',
    badge: 'Puppeteer · Chrome DevTools Protocol',
    intro:
      'Puppeteer passes the proxy to Chrome as a launch flag, and Chrome will not accept credentials in that flag — which is why the natural first attempt produces a proxy authentication dialog and a hang rather than a page. The working pattern is two steps: the server in the launch argument, the credentials through page.authenticate. Everything else follows from there.',
    keywords: [
      'puppeteer mobile proxy',
      'puppeteer proxy authentication',
      'puppeteer 4g proxy',
      'puppeteer proxy-server',
      'puppeteer rotating proxy',
      'puppeteer scraping proxy',
    ],
    problem: {
      heading: 'The problem: --proxy-server does not take a password',
      body:
        'Chrome\'s --proxy-server flag accepts a scheme, host and port, and nothing else. Put credentials in it and Chrome ignores them, the upstream answers 407, and Puppeteer sits at a modal auth prompt you cannot see in headless mode — so the symptom is a navigation that never resolves rather than an error that names the cause. Underneath that, the same thing that pushes people to Puppeteer in the first place still applies: a headless Chrome running from a cloud IP is trivially identifiable, so the content you are automating against may not be the content a real visitor gets.',
      symptoms: [
        'goto() hangs until timeout with no error after adding --proxy-server with credentials.',
        'ERR_INVALID_AUTH_CREDENTIALS or a silent 407 in the network log.',
        'Auth that works on the first page and fails on every subsequent one.',
        'New pages or popups bypassing the proxy auth you set on the first page.',
        'Bandwidth cost scaling with full page weight because nothing is intercepted.',
      ],
    },
    code: [
      {
        label: 'Set the connection URL',
        lang: 'bash',
        code: `${proxyUrlExport('mbl', 'us', 'sticky', 'pptr01')}

# One browser instance per session. Chrome applies the proxy flag
# process-wide, so a second identity means a second browser.`,
      },
      {
        label: 'The working pattern: flag for host, authenticate for credentials',
        lang: 'javascript',
        code: `import puppeteer from 'puppeteer';

const url = new URL(process.env.PROXY_URL);

const browser = await puppeteer.launch({
  headless: 'new',
  args: [
    // Host and port ONLY — Chrome ignores credentials placed here.
    \`--proxy-server=http://\${url.host}\`,
  ],
});

const page = await browser.newPage();

// This is the step that is missing from most examples.
await page.authenticate({
  username: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
});

await page.goto('https://api.ipify.org?format=json', { waitUntil: 'domcontentloaded' });
console.log(await page.evaluate(() => document.body.innerText));

await browser.close();`,
        note: 'page.authenticate is per page. Every new page or popup needs its own call — see below.',
      },
      {
        label: 'Authenticate every page, including popups',
        lang: 'javascript',
        code: `const creds = {
  username: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
};

// Catch pages the site opens itself, which otherwise hit a 407 you never see.
browser.on('targetcreated', async (target) => {
  if (target.type() !== 'page') return;
  const p = await target.page();
  if (p) await p.authenticate(creds);
});

const page = await browser.newPage();
await page.authenticate(creds);`,
        note: 'Without the targetcreated hook, a window.open on the target silently breaks the run.',
      },
      {
        label: 'Intercept requests — you pay per gigabyte',
        lang: 'javascript',
        code: `await page.setRequestInterception(true);

page.on('request', (req) => {
  if (['image', 'media', 'font', 'stylesheet'].includes(req.resourceType())) {
    return req.abort();
  }
  return req.continue();
});

// Mobile viewport, so the site serves its mobile build to your mobile IP.
await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 3 });
await page.goto('https://target.example/product/123', { waitUntil: 'domcontentloaded' });`,
        note: 'Interception must be enabled before goto, and every request needs exactly one abort or continue.',
      },
    ],
    rotation: {
      mode: 'sticky',
      token: '-rot-sticky',
      why:
        'Chrome takes the proxy as a process-level launch flag, so the whole browser shares one exit — the unit of identity in Puppeteer is the browser instance, not the page. That makes sticky the natural fit: pin the browser with -rot-sticky and a distinct -sid-, run the session to completion, then close it. When you want a different identity, launch a second browser with a different sid rather than trying to move the exit under a live Chrome, which will invalidate whatever session state you had built up.',
      alternatives: [
        { mode: 'auto10', when: 'Short-lived browsers doing stateless work, where each launch handles a handful of independent pages.' },
        { mode: 'hard', when: 'Long monitoring sessions that must not change device for hours at a time.' },
        { mode: 'auto30', when: 'Background crawls that want some IP diversity across a long run without disturbing short sessions.' },
      ],
    },
    bandwidth: {
      lead:
        'Puppeteer drives real Chrome, so it downloads what Chrome downloads. Request interception is not an optimisation here — on a per-GB pool it is the main cost control you have.',
      rows: [
        { workload: 'Typical page, all assets, fresh profile', perUnit: '2–5 MB', perGb: '~200–520 pages' },
        { workload: 'Same page, images/media/fonts aborted', perUnit: '400–900 KB', perGb: '~1,150–2,600 pages' },
        { workload: 'Same page, reused browser with warm cache', perUnit: '150–500 KB', perGb: '~2,000–7,000 pages' },
        { workload: 'Document blocked, XHR/fetch only', perUnit: '5–50 KB', perGb: '~20,000–200,000 calls' },
      ],
      tip:
        'Launching a fresh browser per URL throws away the cache and re-downloads every asset — it is the most common reason a Puppeteer bill lands several times over estimate. Reuse one browser across the pages in a session, intercept aggressively, and only take screenshots on the pages that actually fail. Ranges are typical for commercial sites; meter your own before sizing a budget.',
    },
    countries: [
      { slug: 'usa', why: 'Default market for most automation, and where cloud-egress bot management bites hardest.' },
      { slug: 'uk', why: 'Second English-language market with its own content and consent paths.' },
      { slug: 'germany', why: 'EU consent flows that never appear to a US-region CI runner, and routinely break selectors.' },
      { slug: 'france', why: 'Local-language rendering that a non-FR exit will not exercise.' },
      { slug: 'netherlands', why: 'Fast EU exit with straightforward consent behaviour.' },
      { slug: 'poland', why: 'Good pool depth for sustained crawls at a lower cost per session.' },
    ],
    legitimate: [
      'Automate sites you own or are authorised to automate against.',
      'A headless browser generates load far faster than a human — throttle deliberately and honour Retry-After.',
      'Do not use automation to bulk-create accounts, defeat captchas you were not meant to pass, or bypass access controls.',
      'Keep synthetic traffic out of other people\'s analytics where you reasonably can, and never generate billable events you do not intend.',
    ],
    faqs: [
      {
        q: 'Why does --proxy-server with credentials in the URL not work?',
        a: 'Chrome\'s flag accepts only a scheme, host and port. Credentials placed there are ignored, the upstream returns 407, and headless Chrome waits at an invisible auth dialog — which is why the symptom is a hang rather than an error. Pass the credentials with page.authenticate instead.',
      },
      {
        q: 'Do I need to call page.authenticate on every page?',
        a: 'Yes. It is per page, not per browser. Call it on each page you create, and add a browser.on("targetcreated") hook so pages the site opens itself get authenticated too.',
      },
      {
        q: 'Can I use different proxies for different pages in one browser?',
        a: 'Not with the launch flag — Chrome applies it process-wide, so one browser means one exit. Launch a separate browser instance per identity, each with its own -sid-. If you need per-context proxies in a single browser, Playwright supports that directly.',
      },
      {
        q: 'Sticky or rotating for Puppeteer?',
        a: 'Sticky. The browser is the unit of identity, and it carries cookies and session state for its lifetime, so you want the exit pinned for that lifetime. Launch a new browser with a new sid when you want a new identity.',
      },
      {
        q: 'How do I keep bandwidth down?',
        a: 'Enable setRequestInterception before navigating and abort image, media, font and stylesheet requests, then reuse one browser so the cache stays warm. That typically cuts a run by 70–80%.',
      },
      {
        q: 'Does this work with puppeteer-extra and stealth plugins?',
        a: 'Yes — the proxy configuration is ordinary Puppeteer launch and page API, so plugins that wrap the launcher inherit it. The proxy and the fingerprint are separate concerns, and a carrier IP addresses the one that fingerprint plugins cannot.',
      },
    ],
    related: ['playwright-mobile-proxy', 'python-mobile-proxy', 'mobile-proxies-for-geo-testing'],
  },
];

/** Lookup by slug. */
export function getUseCasePage(slug: string): UseCasePage | undefined {
  return USE_CASE_PAGES.find((p) => p.slug === slug);
}

/** All slugs — used by generateStaticParams and the sitemap. */
export const USE_CASE_SLUGS = USE_CASE_PAGES.map((p) => p.slug);

/** Resolve the `related` slugs of a page into full entries. */
export function relatedPages(slug: string): UseCasePage[] {
  const page = getUseCasePage(slug);
  if (!page) return [];
  return page.related
    .map(getUseCasePage)
    .filter((p): p is UseCasePage => Boolean(p));
}
