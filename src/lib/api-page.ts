/**
 * Content for the /mobile-proxy-api SEO landing page.
 *
 * Kept out of the page component so the FAQ list can feed both the rendered
 * <details> block and the FAQPage JSON-LD from one source — if the two ever
 * disagree, Google treats it as cloaked markup.
 *
 * Everything here must match how the gateway actually behaves (see the
 * connection reference in /dashboard/keys). Do not describe a flag, pool or
 * rotation mode the gateway does not implement.
 */

import { config } from '@/config';
import { GATEWAY_DISPLAY_HOST, GATEWAY_HTTP_PORT, GATEWAY_SOCKS5_PORT } from '@/lib/gateway';

export const API_TITLE =
  'Mobile Proxy API — One Proxy URL, Any Language | ProxyMobile';

export const API_DESCRIPTION =
  'A mobile proxy API with no SDK to install: one standard HTTP or SOCKS5 proxy URL that works with curl, Python, Node, Playwright and any AI coding assistant. Pay per GB from $5, 10+ countries, rotation built into the URL.';

export const API_H1 = 'The mobile proxy API you can paste into anything';

export const API_INTRO =
  'There is no client library to install and no bespoke REST contract to learn. ProxyMobile speaks the standard proxy protocol every HTTP client already supports, so integrating it means setting one environment variable. Country, pool and rotation are encoded in the proxy username, which means you change behaviour by editing a string — not by rewriting your code.';

/** Why this shape of API suits AI-assisted / "vibe coded" projects. */
export const VIBE_POINTS = [
  {
    heading: 'Nothing for the model to hallucinate',
    body: 'Coding assistants already know how to set a proxy in requests, axios, httpx, Playwright and Puppeteer — it is in every framework\'s documentation and has been for a decade. Ask for "route this through my proxy" and you get working code on the first try, because there is no ProxyMobile-specific SDK surface for the model to guess at.',
  },
  {
    heading: 'One environment variable is the whole integration',
    body: 'Drop PROXY_URL into your .env and pass it wherever your HTTP client takes a proxy. That is the entire change. Nothing in your request-building, retry or parsing logic has to know a proxy exists, so you can add or remove it from a working project without touching the parts you had trouble getting right.',
  },
  {
    heading: 'Change country or rotation without changing code',
    body: 'The username carries the routing: swap -us- for -de- to move country, or -rot-sticky for -rot-auto10 to rotate every ten minutes. In a vibe-coded project this matters — you can tune behaviour from a config value or an env var instead of asking a model to refactor a working file.',
  },
  {
    heading: 'It fails in ways you can read',
    body: 'Because it is an ordinary proxy, a bad key is a 407 and a blocked target is whatever that site returns. You debug with the tools and error messages you already understand rather than decoding a vendor-specific error envelope.',
  },
];

/** Copy-paste snippets. This is marketing copy, so it names the brand host
 *  (GATEWAY_DISPLAY_HOST) rather than the routing host — see src/lib/gateway.ts.
 *  USERNAME and PAK_KEY stay as placeholders, so nothing here runs as-is; the
 *  real host a customer connects to is the one shown in /dashboard/keys. */
export const CODE_SAMPLES = [
  {
    label: 'curl',
    lang: 'bash',
    code: `export PROXY_URL="http://USERNAME-mbl-us-rot-sticky:PAK_KEY@${GATEWAY_DISPLAY_HOST}:${GATEWAY_HTTP_PORT}"

curl -x "$PROXY_URL" https://api.ipify.org?format=json`,
  },
  {
    label: 'Python',
    lang: 'python',
    code: `import os, requests

proxy = os.environ["PROXY_URL"]

r = requests.get(
    "https://api.ipify.org?format=json",
    proxies={"http": proxy, "https": proxy},
    timeout=30,
)
print(r.json())`,
  },
  {
    label: 'Node.js',
    lang: 'javascript',
    code: `import { HttpsProxyAgent } from 'https-proxy-agent';

const agent = new HttpsProxyAgent(process.env.PROXY_URL);

const res = await fetch('https://api.ipify.org?format=json', { agent });
console.log(await res.json());`,
  },
  {
    label: 'Playwright',
    lang: 'javascript',
    code: `import { chromium } from 'playwright';

const url = new URL(process.env.PROXY_URL);

const browser = await chromium.launch({
  proxy: {
    server: \`http://\${url.host}\`,
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  },
});`,
  },
];

/** The prompt a vibe coder can hand to their assistant verbatim. */
export const ASSISTANT_PROMPT = `Route every outbound HTTP request in this project through the proxy in the
PROXY_URL environment variable. It is a standard HTTP proxy with credentials
in the URL. Do not install a vendor SDK — use my HTTP client's normal proxy
option. Keep a single shared client/agent rather than building one per request.`;

export const URL_PARTS = [
  { part: 'pool', values: 'mbl · peer', meaning: 'mbl is real 4G/5G mobile modems; peer is the residential Android pool.' },
  // Derived from config so the documented codes can never drift from the ones
  // we actually offer.
  { part: 'country', values: config.countries.join(', '), meaning: 'Two-letter code for where the exit IP sits.' },
  { part: 'sid', values: 'any [a-z0-9_] string', meaning: 'Session id. Reconnecting with the same sid returns you to the same device.' },
  { part: 'rot', values: 'sticky · auto10 · auto30 · hard · none', meaning: 'How often the exit IP changes. See the table below.' },
  { part: 'port', values: `${GATEWAY_HTTP_PORT} · ${GATEWAY_SOCKS5_PORT}`, meaning: `${GATEWAY_HTTP_PORT} for HTTP/HTTPS, ${GATEWAY_SOCKS5_PORT} for SOCKS5.` },
];

export const ROTATION_MODES = [
  { mode: 'sticky', body: 'Hold one device for the session. Pair it with -sid- to keep the same device across reconnects, as stable as the carrier allows.' },
  { mode: 'auto10', body: 'Rotate roughly every ten minutes. The usual choice for long-running scrapers.' },
  { mode: 'auto30', body: 'Rotate on a longer interval, for jobs that want a slower churn.' },
  { mode: 'hard', body: 'Strict device pin, like sticky.' },
  { mode: 'none', body: 'Default gateway behaviour, no rotation directive.' },
];

/**
 * Ordered deliberately. Ad verification, pricing, SERP and developer
 * automation lead; we do not advertise multi-account social automation as a
 * headline use case, because that traffic converts into chargebacks and
 * compliance load rather than revenue. See src/lib/use-cases.ts.
 */
export const USE_CASES = [
  {
    heading: 'Ad verification',
    body: 'Check that a campaign renders the way it should for a real subscriber on a real carrier, in the country you bought the placement in. Mobile IPs matter here because ad servers treat datacentre traffic differently — often serving a different creative, or nothing at all.',
  },
  {
    heading: 'Price and marketplace monitoring',
    body: 'Track competitor pricing, stock and shipping estimates across regions. Retail sites localise heavily and rate-limit aggressively, so a rotating mobile pool gets you consistent reads where a fixed IP gets stale prices or a block page.',
  },
  {
    heading: 'SERP and rank tracking',
    body: 'Search results differ by country, carrier and device class. Querying through mobile IPs in the market you care about gives you the ranking a real user in that market sees, rather than a datacentre approximation of it.',
  },
  {
    heading: 'AI agents and browser automation',
    body: 'Agents that browse — research crawlers, shopping bots, QA runners — hit bot walls fast from a cloud IP, because the whole datacentre range is known. Pointing the agent\'s browser at a mobile proxy is a one-line change in Playwright or Puppeteer and removes an entire class of failure.',
  },
  {
    heading: 'Web scraping and data collection',
    body: 'Long crawls survive better on carrier IPs that rotate on a schedule you control. Set auto10, run the job, and pay for the gigabytes you moved rather than a per-request markup.',
  },
  {
    heading: 'QA and geo-testing',
    body: 'Test the localised build of your own app or checkout flow — currency, language, tax, shipping rules, geo-gated content — from inside the market instead of guessing what a user there would see.',
  },
  {
    heading: 'Market and review research',
    body: 'Aggregate listings, reviews and availability across regions for research, without your own office IP shaping the results you get back.',
  },
];

export const API_FAQS = [
  {
    q: 'Do I need to install an SDK to use the mobile proxy API?',
    a: 'No. ProxyMobile is a standard HTTP and SOCKS5 proxy, so any HTTP client, browser automation framework or scraping library that supports proxies already supports it. You set one proxy URL and you are done.',
  },
  {
    q: 'How do I use it with an AI coding assistant?',
    a: 'Tell your assistant to route requests through the proxy in your PROXY_URL environment variable using your HTTP client\'s normal proxy option, and not to install a vendor SDK. Because proxy support is a standard feature of every major library, the generated code works without any ProxyMobile-specific knowledge.',
  },
  {
    q: 'How do I change country or rotation?',
    a: 'Both are encoded in the proxy username. Swap the two-letter country token to move country, and change the -rot- token to switch between sticky sessions and timed rotation. Your code does not change — only the URL string.',
  },
  {
    q: 'What is the difference between the mbl and peer pools?',
    a: 'The mbl pool is real 4G/5G carrier modems. The peer pool is the residential Android peer pool. You pick between them with the first token in the username, and both are billed at the same per-GB rate.',
  },
  {
    q: 'Does it work with Playwright, Puppeteer and Selenium?',
    a: 'Yes. All three accept a proxy server with credentials at launch, which is exactly what the connection URL gives you. Browser automation is one of the most common ways our customers use the pool.',
  },
  {
    q: 'How is API usage billed?',
    a: 'Per gigabyte of traffic, from $7/GB down to $5/GB at volume. There is no per-request fee, no monthly subscription and no charge for API calls themselves — you add credits and the bandwidth you use is drawn from that balance.',
  },
  {
    q: 'Can I keep the same IP across requests?',
    a: 'Yes. Add a -sid- token with any identifier you choose and use rotation mode sticky. Reconnecting with the same sid returns you to the same device, so a login session survives across requests and restarts.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Your first top-up gets $2 in free credit added on top, which is enough to test the pool properly against your own targets before committing to a larger balance.',
  },
];
