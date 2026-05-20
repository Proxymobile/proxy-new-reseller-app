# Landing Page Plan — ProxyHub

> Marketing page architecture. Psychologically optimized conversion flow.
> Each section has a job. No fluff. Every line earns its place.

---

## Target Customer Profile

### Who buys this
| Segment | Use case | What they care about |
|---------|----------|---------------------|
| **Web scrapers** | Data extraction at scale | IP rotation, geo targeting, not getting blocked |
| **Ad verification** | See real ads from real locations | Clean mobile IPs, multi-geo, speed |
| **Social media ops** | Multi-account management | Sticky sessions, residential trust scores |
| **SEO professionals** | SERP checking from target markets | Fast country switching, reliability |
| **Automation engineers** | Bots, scripts, pipelines | Simple integration, standard protocols |
| **Privacy buyers** | Anonymous browsing | No KYC, no email, clean IPs |

### What burned them before
1. Complex setup — different endpoints per country, dashboard-dependent session management
2. Datacenter IPs that get flagged instantly
3. Hidden fees, bandwidth multipliers, overage charges
4. KYC walls, approval delays, email verification loops
5. Vendor lock-in through proprietary SDKs
6. Unreliable sessions that drop mid-workflow

### What makes them buy
- Proof of real mobile/residential IPs (not recycled datacenter)
- Simplicity — can they start in under 60 seconds?
- Transparent pricing they can predict
- No personal data required
- Works with their existing tools (curl, Puppeteer, Scrapy, whatever)

---

## The Killer Differentiator: One-Port Architecture

Most proxy providers force you into:
- Different hostnames per country
- Different ports per pool type
- API calls to manage sessions
- Dashboard clicks to change rotation

**Our system: one endpoint. Everything in the URL.**

```
http://{user}-{pool}-{country}-sid-{session}-rot-{mode}:{key}@gw.proxies.sx:7000
```

Change country? Swap two characters. Change rotation? Edit one token. Run 50 parallel sessions? 50 different `-sid-` values. No API calls. No dashboard. No SDK.

This is the central selling point. It should permeate every section.

---

## Page Sections (in scroll order)

### 1. HERO
**Job:** Stop the scroll. State the outcome, not the product.

**Headline direction:**
> One endpoint. Every country. Real mobile IPs.

Or:
> The proxy that fits in a URL.

**Subhead:** Explain the mechanic in one sentence.
> Mobile and residential proxies from 9 countries. Pick your country, rotation, and session — all encoded in a single connection string. No SDK. No dashboard. Just a URL.

**CTA:** `Get Your Access Code` (primary) + `See Pricing` (secondary)

**Trust chips below CTA (small, horizontal):**
- Real 4G/5G devices
- 9 countries
- HTTP + SOCKS5
- No email required
- Pay per GB

**Visual:** Keep the dashboard preview mockup — it proves the product is real and polished. But make the proxy URL inside it more prominent.

---

### 2. TRUST BAR
**Job:** Instant credibility. No words needed.

Horizontal strip of live stats pulled from the system:
- **X endpoints online** (from pool stock API)
- **9 countries**
- **2 pool types**
- **5 rotation modes**
- **HTTP + SOCKS5**

Small, muted, factual. Not marketing language — system data.

---

### 3. THE PROBLEM (implicit)
**Job:** Validate their frustration without naming it. Make them nod.

**Title:** "You've used proxies before."

Three cards, each a pain point stated as a fact:

| Icon | Statement |
|------|-----------|
| Maze | Different endpoint per country. Different port per protocol. Docs you need a PhD to read. |
| Clock | Signup forms, email verification, KYC approval. You just wanted to run a script. |
| Money | "Unlimited bandwidth" that throttles at 2GB. Overage fees buried in the ToS. |

No solution yet. Just recognition. This builds trust — "they understand my problem."

---

### 4. ONE-PORT SYSTEM (the reveal)
**Job:** Show the solution is architecturally different. This is the "aha" moment.

**Title:** "One endpoint. Everything in the URL."

Visual: animated or static diagram showing:

```
Traditional proxy:
  us.proxy.com:8080      (US HTTP)
  us.proxy.com:1080      (US SOCKS5)
  de.proxy.com:8080      (DE HTTP)
  de.proxy.com:1080      (DE SOCKS5)
  ... 18 endpoints

ProxyHub:
  gw.proxies.sx:7000     (everything)
```

Then show the URL anatomy — a proxy URL broken into labeled segments:

```
http://  user  -mbl  -us  -sid-abc123  -rot-sticky  :pak_xxx  @gw.proxies.sx:7000
         ^      ^     ^    ^            ^             ^
       account pool country session    rotation      key
```

**Key copy beneath:** "Switch country by changing two characters. Switch pool by changing three. No reconnection. No new credentials. No API call."

---

### 5. HOW IT WORKS
**Job:** Make the path to value feel effortless. Three steps max.

**Title:** "Running in 60 seconds."

| Step | Title | Detail |
|------|-------|--------|
| 1 | **Get your access code** | No email. No signup form. One code, instant access. |
| 2 | **Pick a plan** | Choose your GB. Fund your account. Buy a proxy key. |
| 3 | **Build your URL** | Select country, pool, rotation. Generate. Paste into any HTTP client. |

Below: a live code block showing a working curl command:
```bash
curl -x http://user-mbl-us-rot-sticky:pak_xxx@gw.proxies.sx:7000 https://api.ipify.org
# Returns: 174.xxx.xxx.xxx (US mobile IP)
```

This is proof. Not a promise — a command they can run.

---

### 6. TWO POOLS
**Job:** Explain the product depth. Mobile vs residential — different tools for different jobs.

**Title:** "Two pools. One gateway."

Two side-by-side cards:

**Mobile (mbl)**
- Real 4G/5G SIM-connected modems
- Highest trust score — carrier-grade IPs
- Best for: sites that block everything else
- Clean IP reputation, carrier-assigned

**Residential (peer)**
- Real home connections via Android peers
- ISP-assigned IPs across metro areas
- Best for: volume scraping, ad verification
- Lower cost per GB

Both cards end with: "Same endpoint. Same port. Same URL format."

---

### 7. FEATURES GRID
**Job:** Checkbox satisfaction. Prove depth without overwhelming.

**Title:** "Built for automation."

Compact 2x3 or 3x2 grid:

| Feature | Detail |
|---------|--------|
| **5 rotation modes** | Sticky, auto-10m, auto-30m, hard rotate, default. All via URL. |
| **Session pinning** | Same `-sid-` = same IP. Different `-sid-` = different IP. Run 100 sessions in parallel. |
| **HTTP + SOCKS5** | Port 7000 for HTTP/HTTPS. Port 7001 for SOCKS5. Same credentials. |
| **9 countries** | US, DE, PL, FR, ES, GB, CH, PA, AM. More coming. |
| **Instant provisioning** | Key active the moment you pay. No approval queue. |
| **Works everywhere** | curl, Python, Node.js, Puppeteer, Scrapy, Selenium — standard proxy protocol. |

---

### 8. INTEGRATION EXAMPLES
**Job:** Remove the "will it work with my stack?" objection.

**Title:** "Works with everything you already use."

Tabbed code blocks:

**curl:**
```bash
curl -x http://user-mbl-us-sid-s1-rot-sticky:pak_xxx@gw.proxies.sx:7000 \
  https://httpbin.org/ip
```

**Python (requests):**
```python
import requests
proxy = "http://user-mbl-de-rot-hard:pak_xxx@gw.proxies.sx:7000"
r = requests.get("https://httpbin.org/ip", proxies={"http": proxy, "https": proxy})
print(r.json())
```

**Node.js:**
```javascript
const proxy = "http://user-mbl-gb-sid-n1:pak_xxx@gw.proxies.sx:7000";
// Works with axios, got, undici, puppeteer — any HTTP client
```

**Puppeteer:**
```javascript
const browser = await puppeteer.launch({
  args: ['--proxy-server=http://gw.proxies.sx:7000']
});
// Authenticate via page.authenticate({ username, password })
```

Short. Runnable. No SDK to install.

---

### 9. COVERAGE MAP
**Job:** Geo credibility. Show the network is real.

**Title:** "Live network status."

Visual: stylized map or grid of country cards (similar to the dashboard pool status grid but public-facing). Each shows:
- Flag + country name
- Mobile endpoint count
- Peer endpoint count
- Green dot = online

Consider pulling live data from `/api/pool/stock` (public-safe subset) to show real numbers. This is powerful — it proves the network exists right now.

---

### 10. PRICING
**Job:** Remove cost anxiety. Make the math obvious.

**Title:** "Transparent pricing. No surprises."

Already exists — keep the three-card layout but enhance:

| Plan | GB | Price | $/GB | Duration |
|------|----|-------|------|----------|
| Starter | 5 | $35 | $7.00 | 30 days |
| Pro | 25 | $150 | $6.00 | 30 days |
| Scale | 100 | $500 | $5.00 | 30 days |

Add beneath each:
- "Both pools included"
- "All countries included"
- "All rotation modes included"

This counters the "is it extra?" objection.

**Below pricing cards, add one line:**
> No overage fees. No bandwidth multipliers. When your GB runs out, top up. That's it.

---

### 11. FAQ / OBJECTION HANDLING
**Job:** Kill remaining doubts. Every question is a buying objection in disguise.

**Title:** "Common questions."

Collapsible accordion:

| Question | Answer |
|----------|--------|
| **What kind of IPs are these?** | Real mobile IPs from 4G/5G SIM-connected modems and residential IPs from Android devices on home ISPs. Not datacenter. Not recycled. |
| **Do I need to install anything?** | No. ProxyHub uses standard HTTP/SOCKS5 proxy protocol. If your tool supports a proxy URL, it works. |
| **How do I switch countries?** | Change two characters in your proxy URL. `mbl-us` becomes `mbl-de`. Same endpoint, same port, same key. |
| **What happens when my traffic runs out?** | Your key stops working. No overage charges. Top up from your dashboard to continue. |
| **Is my data logged?** | We don't log your proxy traffic. We track bandwidth usage for billing. That's it. |
| **Can I use this for [specific use case]?** | If it's legal in your jurisdiction, yes. We don't restrict use cases. See our Terms of Service. |
| **Do you support crypto payments?** | Coming soon. Currently Stripe (cards) and account balance. |
| **What's an access code?** | Your login credential. No email or password needed. One code, instant access. Your provider gives you one, or you self-register. |

---

### 12. FINAL CTA
**Job:** One last push. Restate the value. Make action effortless.

**Title:** "One URL. Real IPs. Start now."

**Subhead:** "Get your access code and generate your first proxy in under a minute."

**CTA button:** `Get Started` → links to `/login`

**Below:** "No email required. No credit card upfront. No commitment."

---

## Design Principles

1. **White space is confidence.** Don't cram. Let each section breathe.
2. **System font stack.** No custom fonts loading. Instant render.
3. **Monospace for technical content.** Proxy URLs, code blocks, IDs — all mono.
4. **Motion is subtle.** Fade-in on scroll. No bouncing, no spinning.
5. **Color is functional.** Primary for actions, accent for positive states, muted for secondary. No decorative color.
6. **Mobile-first.** Most proxy buyers research on mobile, buy on desktop. Both must work.

## Color Psychology
- **Dark text on light bg** = professional, trustworthy
- **Indigo primary (#6366f1)** = technical competence, premium
- **Green accent (#10b981)** = active, online, working
- **No red on the page** = no anxiety, no urgency hacks

## Copy Rules
1. No superlatives (fastest, best, #1)
2. No vague claims (enterprise-grade, military-grade, blazing fast)
3. Every feature stated as a fact, not a promise
4. Technical precision builds trust — say "4G/5G SIM-connected modems" not "premium mobile IPs"
5. Show, don't tell — code blocks > bullet points

---

## Implementation Notes

- Page is already `src/app/page.tsx` (client component with Framer Motion)
- Current page has: hero + dashboard preview + pricing + footer
- New page should keep the dashboard preview (proven social proof pattern)
- Pool stock data can be fetched client-side from `/api/pool/stock` for live coverage section
- Pricing data comes from `src/config.ts` (single source of truth)
- All animations via Framer Motion (already installed)
- Keep it as a single-page scroll — no routing complexity

## Section Priority for MVP
If building incrementally:
1. Hero (rewrite copy)
2. One-Port System (the differentiator)
3. How It Works (3 steps)
4. Two Pools (product depth)
5. Pricing (already exists, enhance)
6. FAQ (objection handling)
7. Integration Examples (developer trust)
8. Live Coverage (if API is public-safe)
