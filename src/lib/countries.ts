/**
 * SEO country dataset for the programmatic /mobile-proxies/[country] pages.
 *
 * Each entry carries its own title, meta description, H1 and — importantly —
 * genuinely unique body copy (not a templated sentence with the country name
 * swapped). Copy mentions real local carriers and local use cases so each page
 * earns its own ranking rather than reading as boilerplate.
 *
 * ACCURACY RULES (these pages are customer promises):
 * - Only list countries with real, sustained mobile stock. Check
 *   `GET https://api.proxies.sx/v1/gateway/pool/availability` before adding one.
 * - Only name carriers that actually appear in the live carrier stock
 *   (`client.pool.getCarrierStock({ pool: 'all' })`). The page also renders
 *   the carriers online right now, so the static list is a floor, not a promise.
 * - "Dedicated modems" exist only in US, GB, FR, NL, PL, GE. Elsewhere mobile
 *   IPs come from real phones on the carrier's network — never say "modem" there.
 * - Rotation: sticky holds a DEVICE (carriers can still re-NAT the IP); the
 *   fastest turnover is a new device per connection. There is no per-request
 *   rotation and no 30-minute mode.
 * - Traffic is valid 30 days per purchase; top-ups add traffic and extend it.
 */

export interface CountryFaq {
  q: string;
  a: string;
}

export interface CountrySection {
  heading: string;
  body: string;
}

export interface Country {
  /** ISO 3166-1 alpha-2, lowercase — the country token in the proxy username. */
  code: string;
  /** URL slug: /mobile-proxies/{slug} */
  slug: string;
  /** Full display name, e.g. "United States". */
  name: string;
  /** Short label, e.g. "USA". */
  shortName: string;
  flag: string;
  capital: string;
  /** Mobile carriers seen in this country's live stock. */
  carriers: string[];
  title: string;
  description: string;
  h1: string;
  /** Lead paragraph. */
  intro: string;
  sections: CountrySection[];
  useCases: string[];
  faqs: CountryFaq[];
}

const PRICE_ANSWER =
  'Pay per GB from $5/GB at volume, with no subscription. Each purchase is valid for 30 days and every top-up adds traffic and extends it. Your key simply stops at zero — no overage fees.';

export const COUNTRIES: Country[] = [
  {
    code: 'us',
    slug: 'usa',
    name: 'United States',
    shortName: 'USA',
    flag: '\u{1F1FA}\u{1F1F8}',
    capital: 'Washington, D.C.',
    carriers: ['T-Mobile', 'AT&T', 'Verizon'],
    title: 'Buy USA Mobile Proxies — Real T-Mobile, AT&T & Verizon 4G/5G IPs | ProxyMobile',
    description:
      'US mobile proxies on real T-Mobile, AT&T and Verizon 4G/5G IPs. Pay per GB from $5/GB, no KYC, instant activation. HTTP & SOCKS5, dedicated modems plus real phones.',
    h1: 'USA Mobile Proxies — Real T-Mobile, AT&T & Verizon 4G/5G IPs',
    intro:
      'Our United States pool routes your traffic through real carrier connections — dedicated T-Mobile 4G/5G modems plus real phones on AT&T, Verizon and T-Mobile. These are the highest-trust addresses on the US internet, which is exactly why sites that block datacenter and even residential ranges wave carrier traffic straight through.',
    sections: [
      {
        heading: 'Why US carrier IPs beat datacenter and residential',
        body: 'American ad platforms, social networks and retail sites weight mobile ASNs far more generously than any other IP class. A T-Mobile or AT&T address carries an implicit trust signal — many legitimate users share each IP through carrier-grade NAT, so blocking one means blocking real customers. That shared-IP reality makes US mobile proxies the go-to for account actions, ad verification and any workflow where a datacenter fingerprint gets you flagged on the first request.',
      },
      {
        heading: 'Coverage across the country',
        body: 'The pool spans devices across the country, so exits land on realistic US geolocations rather than a single warehouse rack. That matters for ad verification and localized SERP checks, where different metros should see different creatives and rankings. Every request exits on a genuine consumer carrier IP with a plausible US footprint.',
      },
      {
        heading: 'Rotation and sessions for US targets',
        body: 'Hold one device for a whole login session with sticky mode, rotate every 5 to 60 minutes, or land on a fresh device with every new connection for wide-scale collection. Run dozens of parallel US sessions at once — each keyed to its own session ID — without touching an API. Switching to the dedicated-modem tier or to US residential is a one-word change in the same username.',
      },
    ],
    useCases: [
      'Verifying US-targeted ad campaigns across metros',
      'Managing multiple US social and marketplace accounts',
      'Localized Google/retail price and ranking checks',
      'Sneaker and ticketing drops on carrier-trust IPs',
    ],
    faqs: [
      {
        q: 'Which US carriers do the IPs come from?',
        a: 'Our dedicated modems run on T-Mobile, and real phones in the pool connect through AT&T, Verizon and T-Mobile. Every exit is a genuine carrier IP — never a datacenter address. The live carrier list is shown at the top of this page.',
      },
      {
        q: 'Can I target a specific US city?',
        a: 'You choose country, network and rotation in the proxy username; exits spread across the country. Contact support if a workflow needs a specific regional footprint.',
      },
      { q: 'How much do USA mobile proxies cost?', a: PRICE_ANSWER },
    ],
  },
  {
    code: 'gb',
    slug: 'uk',
    name: 'United Kingdom',
    shortName: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    capital: 'London',
    carriers: ['Three', 'Vodafone', 'O2'],
    title: 'Buy UK Mobile Proxies — Real Three, Vodafone & O2 4G/5G IPs | ProxyMobile',
    description:
      'UK mobile proxies on real Three, Vodafone and O2 4G/5G IPs. Pay per GB from $5/GB, no KYC, instant activation. HTTP & SOCKS5, dedicated modems plus real phones.',
    h1: 'UK Mobile Proxies — Real Three, Vodafone & O2 4G/5G IPs',
    intro:
      'Our United Kingdom pool routes through dedicated Three UK modems plus real phones on Vodafone UK and O2 — British carrier IPs identical to a handset on a London commute. UK platforms lean heavily on IP reputation, so a carrier address sails past the checks that shut out datacenter and recycled residential ranges.',
    sections: [
      {
        heading: 'British carrier IPs with genuine reputation',
        body: 'Three, Vodafone and O2 run the mobile ASNs that UK anti-fraud stacks recognise as ordinary consumer traffic. With carrier NAT stacking many real subscribers behind each address, these IPs stay clean through workloads that would burn a datacenter range in minutes. That reliability is why UK mobile proxies suit account management, retail research and social automation across British targets.',
      },
      {
        heading: 'See the UK internet as a UK user',
        body: 'Sterling pricing, click-and-collect availability and region-locked catalogues only appear when a site trusts your location. A genuine British carrier exit renders ASOS, Argos and the major grocers exactly as a shopper in Manchester or Glasgow sees them — accurate stock, accurate delivery windows, accurate promotions.',
      },
      {
        heading: 'Rotation control for UK workflows',
        body: 'Sticky mode holds one device across a multi-step journey; timed rotation moves to a new device every 5, 10, 20 or 60 minutes; per-connection mode lands each new connection on a fresh device. Spin up parallel UK sessions with unique session IDs, no API glue required — everything lives in the proxy username.',
      },
    ],
    useCases: [
      'Managing UK social and marketplace accounts',
      'Retail price and stock checks on British sites',
      'Ad verification for UK-targeted campaigns',
      'SERP monitoring across UK regions',
    ],
    faqs: [
      {
        q: 'Which UK carriers do the IPs come from?',
        a: 'Our dedicated modems run on Three UK, and real phones in the pool connect through Vodafone UK and O2. The live carrier list is shown at the top of this page.',
      },
      {
        q: 'Will UK sites treat these as domestic visitors?',
        a: 'Yes. British carrier IPs are seen as native consumer traffic, so UK retail and streaming sites serve real localized pricing, stock and catalogues.',
      },
      { q: 'What does it cost to start?', a: PRICE_ANSWER },
    ],
  },
  {
    code: 'de',
    slug: 'germany',
    name: 'Germany',
    shortName: 'Germany',
    flag: '\u{1F1E9}\u{1F1EA}',
    capital: 'Berlin',
    carriers: ['Deutsche Telekom', 'Vodafone', 'O2'],
    title: 'Buy Germany Mobile Proxies — Real Telekom, Vodafone & O2 4G/5G IPs | ProxyMobile',
    description:
      'German mobile proxies on real Deutsche Telekom, Vodafone and O2 4G/5G IPs. Pay per GB from $5/GB, no KYC, instant activation. HTTP & SOCKS5, real phones on German carriers.',
    h1: 'Germany Mobile Proxies — Real Telekom, Vodafone & O2 4G/5G IPs',
    intro:
      'Our Germany pool exits through real phones on Deutsche Telekom, Vodafone and O2 — carrier IPs indistinguishable from a commuter on the U-Bahn in Berlin or Munich. German platforms are notoriously strict with automated traffic, so a genuine Telekom or Vodafone address is often the difference between a clean session and an instant block.',
    sections: [
      {
        heading: 'German carriers, German trust signals',
        body: 'Deutsche Telekom and Vodafone operate the ASNs that German fraud systems treat as native consumer traffic. Because carrier-grade NAT puts many real customers behind each IP, these addresses cannot be banned without collateral damage. That makes German mobile proxies the pragmatic choice for e-commerce research on Otto, Zalando and Amazon.de, where datacenter ranges are filtered aggressively.',
      },
      {
        heading: 'Built for the German market',
        body: 'Localized pricing, German-language creatives and regional stock levels only surface when a site believes you are a real domestic visitor. A Telekom exit renders the .de experience the way a customer in Hamburg or Cologne actually sees it — correct VAT, correct availability, correct promotions — so your data reflects the live German storefront rather than a geofenced fallback.',
      },
      {
        heading: 'Sessions, rotation and privacy',
        body: 'Hold one device for a full checkout flow with sticky sessions, or land on a fresh device per connection for broad price monitoring. We record bandwidth for billing only — never the contents of your traffic or the URLs you visit. Switch to German residential or another country by changing a single word in the proxy username.',
      },
    ],
    useCases: [
      'Price and availability monitoring on .de retail',
      'Ad verification for German-language campaigns',
      'Managing DACH-region marketplace accounts',
      'QA of geo-targeted German web experiences',
    ],
    faqs: [
      {
        q: 'Which German carriers are in the pool?',
        a: 'German mobile exits come from real phones on Deutsche Telekom, Vodafone and O2 (Telefónica) — the same carrier IPs any German phone receives. The live carrier list is shown at the top of this page.',
      },
      {
        q: 'Are German mobile proxies good for .de e-commerce?',
        a: 'Yes. Carrier IPs are treated as native domestic traffic, so German retail sites serve real localized pricing, stock and promotions instead of blocking or geofencing you.',
      },
      { q: 'How much do Germany mobile proxies cost?', a: PRICE_ANSWER },
    ],
  },
  {
    code: 'fr',
    slug: 'france',
    name: 'France',
    shortName: 'France',
    flag: '\u{1F1EB}\u{1F1F7}',
    capital: 'Paris',
    carriers: ['Free Mobile', 'Bouygues Telecom'],
    title: 'Buy France Mobile Proxies — Real Free & Bouygues 4G/5G IPs | ProxyMobile',
    description:
      'French mobile proxies on real Free Mobile and Bouygues Telecom 4G/5G IPs plus dedicated French modems. Pay per GB from $5/GB, no KYC, instant activation. HTTP & SOCKS5.',
    h1: 'France Mobile Proxies — Real Free Mobile & Bouygues 4G/5G IPs',
    intro:
      'Our France pool combines dedicated French 4G/5G modems with real phones on Free Mobile and Bouygues Telecom — carrier IPs identical to a phone on the Paris Métro. French platforms filter foreign and datacenter traffic aggressively, so a native carrier address is what keeps your sessions on French sites stable.',
    sections: [
      {
        heading: 'French carrier trust',
        body: 'French fraud systems treat mobile carrier ranges as ordinary consumer traffic. Because carrier NAT places many real subscribers behind each IP, a Free Mobile or Bouygues address cannot be blocked without hitting genuine customers — which is precisely why French mobile proxies hold up on Leboncoin, Vinted and the .fr retail estate where cheaper IP classes get filtered.',
      },
      {
        heading: 'The French market, rendered natively',
        body: 'Euro pricing, French-language creative and France-only availability only appear when a site is confident you are browsing from within the country. A genuine French carrier exit shows the .fr storefront as a shopper in Lyon or Marseille sees it — correct TVA, correct stock, correct regional promotions — so your collected data matches the live French experience.',
      },
      {
        heading: 'Flexible rotation for French targets',
        body: 'Keep one device pinned through a checkout with sticky mode, or land on a fresh device per connection for large-scale price and listing monitoring. Parallel French sessions each run on their own device via unique session IDs — no session dashboard, no API.',
      },
    ],
    useCases: [
      'Monitoring Leboncoin and Vinted listings',
      'Price checks across .fr retail',
      'Ad verification for French campaigns',
      'Managing French marketplace accounts',
    ],
    faqs: [
      {
        q: 'Which French carriers are in the pool?',
        a: 'France combines dedicated 4G/5G modems with real phones on Free Mobile and Bouygues Telecom. The live carrier list is shown at the top of this page.',
      },
      {
        q: 'Are these good for .fr classifieds and retail?',
        a: 'Yes. French carrier IPs read as native consumer traffic, so sites like Leboncoin, Vinted and .fr retailers serve real localized content instead of blocking you.',
      },
      { q: 'How is billing handled?', a: PRICE_ANSWER },
    ],
  },
  {
    code: 'es',
    slug: 'spain',
    name: 'Spain',
    shortName: 'Spain',
    flag: '\u{1F1EA}\u{1F1F8}',
    capital: 'Madrid',
    carriers: ['Orange', 'Movistar', 'Vodafone'],
    title: 'Buy Spain Mobile Proxies — Real Orange, Movistar & Vodafone 4G/5G IPs | ProxyMobile',
    description:
      'Spanish mobile proxies on real Orange, Movistar and Vodafone 4G/5G IPs. Pay per GB from $5/GB, no KYC, instant activation. HTTP & SOCKS5, real phones on Spanish carriers.',
    h1: 'Spain Mobile Proxies — Real Orange, Movistar & Vodafone 4G/5G IPs',
    intro:
      'Our Spain pool routes through real phones on Orange Spain, Movistar and Vodafone Spain — carrier IPs indistinguishable from a phone in Madrid or Barcelona. Spanish platforms weight mobile ASNs heavily, so a genuine carrier address clears the reputation checks that block datacenter and recycled residential traffic.',
    sections: [
      {
        heading: 'Spanish carrier reputation',
        body: 'Movistar and Orange run the largest mobile networks in Spain, and their ranges register as native consumer traffic to Spanish fraud systems. Carrier NAT stacks many real users behind each IP, so these addresses stay usable through workloads that would exhaust a datacenter pool. That durability is what makes Spanish mobile proxies effective for Wallapop, Vinted ES and .es retail research.',
      },
      {
        heading: 'A native Spanish storefront',
        body: 'Euro pricing, Castilian-language creative and Spain-only promotions only render when a site trusts your origin. A real Spanish carrier exit shows El Corte Inglés, PcComponentes and the marketplaces exactly as a shopper in Valencia or Seville sees them — correct IVA, correct stock, correct offers.',
      },
      {
        heading: 'Rotation and parallel sessions',
        body: 'Pin one device for a login flow with sticky mode, or land on a fresh device per connection for wide monitoring. Run many concurrent Spanish sessions, each on its own device, using unique session IDs — no API required.',
      },
    ],
    useCases: [
      'Monitoring Wallapop and Vinted ES listings',
      'Price and stock checks on .es retail',
      'Ad verification for Spanish campaigns',
      'Managing Spanish marketplace accounts',
    ],
    faqs: [
      {
        q: 'Which Spanish carriers are in the pool?',
        a: 'Spanish mobile exits come from real phones on Orange Spain, Movistar (Telefónica) and Vodafone Spain. The live carrier list is shown at the top of this page.',
      },
      {
        q: 'Do Spanish sites serve local content on these IPs?',
        a: 'Yes. Spanish carrier IPs read as native traffic, so .es retailers and marketplaces serve real localized pricing, stock and promotions.',
      },
      { q: 'What is the starting price?', a: PRICE_ANSWER },
    ],
  },
  {
    code: 'it',
    slug: 'italy',
    name: 'Italy',
    shortName: 'Italy',
    flag: '\u{1F1EE}\u{1F1F9}',
    capital: 'Rome',
    carriers: ['TIM', 'Vodafone', 'WindTre', 'Iliad'],
    title: 'Buy Italy Mobile Proxies — Real TIM, Vodafone & WindTre 4G/5G IPs | ProxyMobile',
    description:
      'Italian mobile proxies on real TIM, Vodafone, WindTre and Iliad 4G/5G IPs. Pay per GB from $5/GB, no KYC, instant activation. HTTP & SOCKS5, real phones on Italian carriers.',
    h1: 'Italy Mobile Proxies — Real TIM, Vodafone, WindTre & Iliad 4G/5G IPs',
    intro:
      'Our Italy pool exits through real phones on TIM, Vodafone Italia, WindTre and Iliad — the four networks nearly every Italian handset uses. Italian retail and classifieds sites are quick to challenge foreign and datacenter traffic, so a native carrier address keeps sessions flowing where other IP classes stall on a CAPTCHA.',
    sections: [
      {
        heading: 'Four Italian networks, one pool',
        body: 'TIM and Vodafone dominate Italian mobile traffic, with WindTre and Iliad covering most of the rest — so exits from all four blend into ordinary Italian consumer traffic rather than clustering on one small ASN. Carrier NAT keeps many real subscribers behind each address, which is why these IPs survive the reputation filters that burn datacenter ranges.',
      },
      {
        heading: 'Subito, Vinted and .it retail, as Italians see them',
        body: 'Regional pricing, Italian-language creative and Italy-only listings only appear for visitors a site believes are local. A genuine Italian carrier exit renders Subito, Vinted IT, Amazon.it and the major electronics chains the way a shopper in Milan or Naples sees them — correct IVA, correct stock, correct promotions.',
      },
      {
        heading: 'Rotation for Italian workloads',
        body: 'Hold one device through a multi-step flow with sticky mode, rotate every 5 to 60 minutes, or give every new connection a fresh device for broad listing collection. Parallel Italian sessions each get their own device through unique session IDs — configured entirely in the proxy username.',
      },
    ],
    useCases: [
      'Monitoring Subito and Vinted IT listings',
      'Price and stock checks across .it retail',
      'Ad verification for Italian campaigns',
      'Managing Italian marketplace and social accounts',
    ],
    faqs: [
      {
        q: 'Which Italian carriers are in the pool?',
        a: 'Italian mobile exits come from real phones on TIM, Vodafone Italia, WindTre and Iliad. The live carrier list is shown at the top of this page.',
      },
      {
        q: 'Will Italian sites treat me as a local visitor?',
        a: 'Yes. Italian carrier IPs read as native consumer traffic, so Italian retailers and classifieds serve real localized listings, pricing and promotions.',
      },
      { q: 'How much do Italy mobile proxies cost?', a: PRICE_ANSWER },
    ],
  },
  {
    code: 'nl',
    slug: 'netherlands',
    name: 'Netherlands',
    shortName: 'Netherlands',
    flag: '\u{1F1F3}\u{1F1F1}',
    capital: 'Amsterdam',
    carriers: ['Vodafone'],
    title: 'Buy Netherlands Mobile Proxies — Dedicated Dutch 4G/5G Modems | ProxyMobile',
    description:
      'Netherlands mobile proxies on dedicated Dutch 4G/5G carrier modems, including Vodafone NL. Pay per GB from $5/GB, no KYC, instant activation. HTTP & SOCKS5, native Dutch addresses.',
    h1: 'Netherlands Mobile Proxies — Dedicated Dutch 4G/5G Carrier Modems',
    intro:
      'Our Netherlands pool runs on dedicated 4G/5G modems with Dutch SIM cards, including Vodafone NL — carrier IPs identical to a phone in Amsterdam or Rotterdam. Dutch mobile networks sit on some of the best infrastructure in Europe, and every exit is one of our own monitored modems rather than a borrowed device.',
    sections: [
      {
        heading: 'Why Dutch carrier IPs perform',
        body: 'European platforms weight mobile ASNs far more generously than datacenter ranges. Carrier-grade NAT puts many real Dutch subscribers behind each address, so blocking one risks blocking genuine customers — which is exactly why sites that reject datacenter and even residential ranges let Dutch carrier traffic through on the first request.',
      },
      {
        heading: 'Dedicated, monitored modems',
        body: 'Because the Dutch pool is made of our own carrier modems, it is steadier than a pool of borrowed phones: devices stay online, connections hold, and sticky sessions keep the same device for as long as you need it. That stability matters for account management, where each session should keep one trusted address.',
      },
      {
        heading: 'Rotation and sessions for NL targets',
        body: 'Pin one device for a login session with sticky mode, or land on a fresh device per connection for large-scale work. Run parallel Dutch sessions, each keyed to its own session ID, with no API calls. Switching from Dutch mobile to Dutch residential is a one-word change in the same username.',
      },
    ],
    useCases: [
      'Managing multiple Dutch social and marketplace accounts',
      'Verifying Netherlands-targeted ad campaigns',
      'Localized Google/retail price and ranking checks in NL',
      'EU-market research on a high-trust mobile IP',
    ],
    faqs: [
      {
        q: 'Which Dutch carriers are in the pool?',
        a: 'Dutch mobile exits come from our dedicated 4G/5G modems on Dutch SIM cards, including Vodafone NL. The live carrier list is shown at the top of this page.',
      },
      {
        q: 'Why are Netherlands mobile proxies useful?',
        a: 'Dutch carrier IPs read as native consumer traffic, so NL and EU sites serve real localized content instead of geoblocking foreign datacenter ranges. Running on dedicated modems also keeps sessions steady.',
      },
      { q: 'What is the starting price?', a: PRICE_ANSWER },
    ],
  },
  {
    code: 'pl',
    slug: 'poland',
    name: 'Poland',
    shortName: 'Poland',
    flag: '\u{1F1F5}\u{1F1F1}',
    capital: 'Warsaw',
    carriers: ['Play', 'Plus', 'Orange'],
    title: 'Buy Poland Mobile Proxies — Real Play, Plus & Orange 4G/5G IPs | ProxyMobile',
    description:
      'Polish mobile proxies on real Play, Plus and Orange 4G/5G IPs. Pay per GB from $5/GB, no KYC, instant activation. HTTP & SOCKS5, dedicated modems plus real phones.',
    h1: 'Poland Mobile Proxies — Real Play, Plus & Orange 4G/5G IPs',
    intro:
      'Our Poland pool runs on dedicated modems with Play and Plus SIM cards, plus real phones on Orange Poland — carrier IPs identical to a phone in Warsaw or Kraków. Poland is one of Europe’s fastest-growing e-commerce markets, and its platforms trust domestic carrier traffic far more than any datacenter range.',
    sections: [
      {
        heading: 'Polish carrier IPs that platforms trust',
        body: 'Play, Plus and Orange operate the mobile ASNs that Polish fraud systems treat as ordinary consumer traffic. Carrier NAT places many real subscribers behind each address, so these IPs remain usable through demanding workloads. That reliability makes Polish mobile proxies a strong fit for Allegro, OLX and the .pl retail ecosystem where cheaper IPs are filtered on sight.',
      },
      {
        heading: 'Built for the Allegro-driven market',
        body: 'Złoty pricing, Polish-language listings and Poland-only availability only surface when a site believes you are browsing domestically. A genuine Polish carrier exit renders Allegro and the major retailers the way a shopper in Wrocław or Gdańsk sees them — correct pricing, correct stock, correct promotions.',
      },
      {
        heading: 'Rotation and sessions for PL targets',
        body: 'Hold one device for the length of a session with sticky mode, or land on a fresh device per connection for broad listing collection across Allegro and OLX. Parallel Polish sessions each run on their own device through unique session IDs, no API required.',
      },
    ],
    useCases: [
      'Monitoring Allegro and OLX listings and prices',
      'Managing Polish marketplace accounts',
      'Ad verification for Polish campaigns',
      'Localized .pl SERP and retail checks',
    ],
    faqs: [
      {
        q: 'Which Polish carriers are in the pool?',
        a: 'Our dedicated modems run on Play and Plus SIM cards, and real phones in the pool connect through Orange Poland. The live carrier list is shown at the top of this page.',
      },
      {
        q: 'Are these good for Allegro and OLX?',
        a: 'Yes. Polish carrier IPs read as native consumer traffic, so Allegro, OLX and .pl retailers serve real localized listings and pricing.',
      },
      { q: 'How much do Poland mobile proxies cost?', a: PRICE_ANSWER },
    ],
  },
  {
    code: 'br',
    slug: 'brazil',
    name: 'Brazil',
    shortName: 'Brazil',
    flag: '\u{1F1E7}\u{1F1F7}',
    capital: 'Brasília',
    carriers: ['Claro', 'Vivo', 'TIM'],
    title: 'Buy Brazil Mobile Proxies — Real Claro, Vivo & TIM 4G/5G IPs | ProxyMobile',
    description:
      'Brazilian mobile proxies on real Claro, Vivo and TIM 4G/5G IPs. Pay per GB from $5/GB, no KYC, instant activation. HTTP & SOCKS5, real phones on Brazilian carriers.',
    h1: 'Brazil Mobile Proxies — Real Claro, Vivo & TIM 4G/5G IPs',
    intro:
      'Our Brazil pool exits through real phones on Claro, Vivo and TIM Brasil — the networks behind the overwhelming majority of Brazilian handsets. Brazil is Latin America’s largest e-commerce market, and its platforms lean on IP reputation heavily, so a native carrier address is what gets you the real Brazilian experience instead of a block page.',
    sections: [
      {
        heading: 'Brazil’s biggest networks',
        body: 'Claro and Vivo together carry most of Brazil’s mobile traffic, with TIM close behind, so exits blend into the everyday traffic of a very large, mobile-first market. Carrier NAT keeps many subscribers behind each address — blocking one means blocking real customers, which is why these IPs outlast datacenter ranges on Brazilian sites.',
      },
      {
        heading: 'Mercado Livre and .com.br, rendered locally',
        body: 'Real-denominated pricing, Portuguese-language creative and region-specific offers only appear for visitors a site trusts as Brazilian. A genuine carrier exit shows Mercado Livre, Magazine Luiza and the major marketplaces as a shopper in São Paulo or Rio sees them — correct prices, stock and delivery promises.',
      },
      {
        heading: 'Rotation for Brazilian workloads',
        body: 'Keep one device through a checkout or login with sticky mode, or give every new connection a fresh device for wide price and listing monitoring. Parallel Brazilian sessions each run on their own device via unique session IDs, all configured in the proxy username.',
      },
    ],
    useCases: [
      'Monitoring Mercado Livre listings and prices',
      'Ad verification for Brazilian campaigns',
      'Managing Brazilian social and marketplace accounts',
      'Localized .com.br SERP and retail checks',
    ],
    faqs: [
      {
        q: 'Which Brazilian carriers are in the pool?',
        a: 'Brazilian mobile exits come from real phones on Claro, Vivo and TIM Brasil. The live carrier list is shown at the top of this page.',
      },
      {
        q: 'Do Brazilian sites serve local content on these IPs?',
        a: 'Yes. Brazilian carrier IPs read as native consumer traffic, so marketplaces and retailers serve real localized pricing, stock and promotions.',
      },
      { q: 'How much do Brazil mobile proxies cost?', a: PRICE_ANSWER },
    ],
  },
  {
    code: 'mx',
    slug: 'mexico',
    name: 'Mexico',
    shortName: 'Mexico',
    flag: '\u{1F1F2}\u{1F1FD}',
    capital: 'Mexico City',
    carriers: ['Claro', 'Telcel'],
    title: 'Buy Mexico Mobile Proxies — Real Claro & Telcel 4G/5G IPs | ProxyMobile',
    description:
      'Mexican mobile proxies on real Claro and Telcel 4G/5G carrier IPs. Pay per GB from $5/GB, no KYC, instant activation. HTTP & SOCKS5, real phones on Mexican carriers.',
    h1: 'Mexico Mobile Proxies — Real Claro & Telcel 4G/5G IPs',
    intro:
      'Our Mexico pool exits through real phones on Claro and Telcel, the América Móvil networks that dominate Mexican mobile traffic. Mexican retail, fintech and delivery apps key hard on IP reputation, so a native carrier address reaches the real Mexican experience where foreign datacenter traffic is challenged or geoblocked.',
    sections: [
      {
        heading: 'Mexico’s dominant carrier group',
        body: 'Telcel and Claro belong to the group that carries the majority of Mexico’s mobile subscribers, so exits look like the country’s most common kind of consumer traffic. Carrier NAT stacks many users behind each IP, which keeps these addresses usable where a datacenter range would be flagged on the first request.',
      },
      {
        heading: 'Mercado Libre and .com.mx, as locals see them',
        body: 'Peso pricing, Mexican-Spanish creative and Mexico-only availability only appear when a site believes you are browsing domestically. A genuine carrier exit renders Mercado Libre, Liverpool and Amazon.com.mx the way a shopper in Mexico City or Guadalajara sees them — correct prices, stock and delivery windows.',
      },
      {
        heading: 'Rotation for Mexican workloads',
        body: 'Hold one device through a login or checkout with sticky mode, or land on a fresh device per connection for broad monitoring. Parallel Mexican sessions each run on their own device through unique session IDs — no API required.',
      },
    ],
    useCases: [
      'Monitoring Mercado Libre listings and prices',
      'Ad verification for Mexican campaigns',
      'Managing Mexican social and marketplace accounts',
      'Localized .com.mx SERP and retail checks',
    ],
    faqs: [
      {
        q: 'Which Mexican carriers are in the pool?',
        a: 'Mexican mobile exits come from real phones on Claro and Telcel. The live carrier list is shown at the top of this page.',
      },
      {
        q: 'Will Mexican sites treat me as a local visitor?',
        a: 'Yes. Mexican carrier IPs read as native consumer traffic, so retailers and marketplaces serve real localized pricing, stock and promotions.',
      },
      { q: 'How much do Mexico mobile proxies cost?', a: PRICE_ANSWER },
    ],
  },
  {
    code: 'ge',
    slug: 'georgia',
    name: 'Georgia',
    shortName: 'Georgia',
    flag: '\u{1F1EC}\u{1F1EA}',
    capital: 'Tbilisi',
    carriers: ['Magti', 'Silknet'],
    title: 'Buy Georgia Mobile Proxies — Real Magti & Silknet 4G/LTE IPs | ProxyMobile',
    description:
      'Georgia (Caucasus) mobile proxies on dedicated Magti and Silknet 4G/LTE carrier modems. Pay per GB from $5/GB, no KYC, instant activation. HTTP & SOCKS5, native GE addresses.',
    h1: 'Georgia Mobile Proxies — Real Magti & Silknet 4G/LTE IPs',
    intro:
      'Our Georgia pool runs on dedicated modems with Magti and Silknet SIM cards — carrier IPs identical to a phone in Tbilisi or Batumi. Georgian mobile IPs are scarce in commercial proxy networks, so these exits reach a Caucasus market that datacenter ranges cannot convincingly serve. This is the country of Georgia (GE), not the US state.',
    sections: [
      {
        heading: 'Rare Georgian carrier IPs',
        body: 'Magti and Silknet run the mobile networks that Georgian platforms treat as native consumer traffic. Because few providers carry genuine Georgian mobile IPs, these exits are hard to fingerprint as proxy traffic, and carrier NAT keeps many real subscribers behind each address — so they remain usable where a foreign datacenter IP is geoblocked on sight.',
      },
      {
        heading: 'Observing the Georgian market',
        body: 'Lari pricing, Georgian-language creative and Georgia-only availability render only for trusted local visitors. A genuine Georgian carrier exit shows regional retail and service portals the way a user in Tbilisi sees them — correct pricing, availability and promotions.',
      },
      {
        heading: 'A small, dedicated pool',
        body: 'Georgia is a boutique pool of our own monitored modems, so it suits focused work — a handful of sticky sessions for account or verification tasks — rather than high-volume scraping. Check the live device count at the top of this page before planning large parallel runs.',
      },
    ],
    useCases: [
      'Localized research in an underserved Caucasus market',
      'Ad verification for Georgia-targeted campaigns',
      'Managing regional accounts and services',
      'Availability and pricing checks on Georgian portals',
    ],
    faqs: [
      {
        q: 'Which Georgian carriers are in the pool?',
        a: 'Georgian exits come from our dedicated 4G/LTE modems on Magti and Silknet SIM cards — the same carrier IPs a Georgian phone receives.',
      },
      {
        q: 'Is this the country or the US state?',
        a: 'The country of Georgia (GE) in the Caucasus, with exits on Georgian mobile carriers — not the US state of Georgia.',
      },
      { q: 'What is the starting price?', a: PRICE_ANSWER },
    ],
  },
];

/** Slugs of country pages we used to publish; redirected so old links and rankings aren't lost. */
export const RETIRED_COUNTRY_SLUGS = ['switzerland', 'panama', 'armenia'];

export function getCountry(slug: string): Country | undefined {
  return COUNTRIES.find((c) => c.slug === slug);
}

/** Pick N sibling countries (for internal links), excluding the given slug. */
export function siblingCountries(slug: string, n = 3): Country[] {
  const idx = COUNTRIES.findIndex((c) => c.slug === slug);
  const out: Country[] = [];
  for (let i = 1; out.length < n && i < COUNTRIES.length; i++) {
    out.push(COUNTRIES[(idx + i) % COUNTRIES.length]);
  }
  return out;
}
