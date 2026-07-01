/**
 * SEO country dataset for the programmatic /mobile-proxies/[country] pages.
 *
 * Each entry carries its own title, meta description, H1 and — importantly —
 * genuinely unique body copy (not a templated sentence with the country name
 * swapped). Copy mentions real local carriers and local use cases so each page
 * earns its own ranking rather than reading as boilerplate.
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
  /** ISO-ish code used in the pricing URL token (matches PRICING_COUNTRIES). */
  code: string;
  /** URL slug: /mobile-proxies/{slug} */
  slug: string;
  /** Full display name, e.g. "United States". */
  name: string;
  /** Short label, e.g. "USA". */
  shortName: string;
  flag: string;
  capital: string;
  /** Real mobile carriers whose IPs this pool draws from. */
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

export const COUNTRIES: Country[] = [
  {
    code: 'us',
    slug: 'usa',
    name: 'United States',
    shortName: 'USA',
    flag: '\u{1F1FA}\u{1F1F8}',
    capital: 'Washington, D.C.',
    carriers: ['T-Mobile', 'Verizon', 'AT&T'],
    title: 'Buy USA Mobile Proxies — Real T-Mobile & Verizon 4G/5G IPs | ProxyMobile',
    description:
      'US mobile proxies on real T-Mobile, Verizon and AT&T 4G/5G IPs. Pay per GB from $5/GB, no signup, instant activation. HTTP & SOCKS5, city-level carrier IPs.',
    h1: 'USA Mobile Proxies — Real T-Mobile, Verizon & AT&T 4G/5G IPs',
    intro:
      'Our United States pool routes your traffic through real SIM cards on T-Mobile, Verizon and AT&T — the same carrier IPs American phones get on 4G and 5G. These are the highest-trust addresses on the US internet, which is exactly why sites that block datacenter and even residential ranges wave carrier traffic straight through.',
    sections: [
      {
        heading: 'Why US carrier IPs beat datacenter and residential',
        body: 'American ad platforms, social networks and retail sites weight mobile ASNs far more generously than any other IP class. A T-Mobile or Verizon address carries an implicit trust signal — millions of legitimate users share each IP through carrier-grade NAT, so blocking one means blocking real customers. That shared-IP reality makes US mobile proxies the go-to for account actions, ad verification and any workflow where a datacenter fingerprint gets you flagged on the first request.',
      },
      {
        heading: 'Coverage across major US metros',
        body: 'The pool spans devices across the country, so exits land on realistic US geolocations rather than a single warehouse rack. That matters for ad verification and localized SERP checks, where a Dallas exit and a New York exit should see different creatives and rankings. Every request exits on a genuine consumer carrier IP with a plausible US city footprint.',
      },
      {
        heading: 'Rotation and sessions for US targets',
        body: 'Pin one Verizon IP for the length of a login session with sticky mode, or cycle a fresh carrier IP on every request for wide-scale collection. Run dozens of parallel US sessions at once — each keyed to its own session ID and its own IP — without touching an API. Switching from mobile to the residential US pool is a three-character change in the same URL.',
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
        a: 'Exits come from real SIM cards on T-Mobile, Verizon and AT&T in physical 4G/5G modems — the same carrier IPs a US phone receives. None are datacenter addresses.',
      },
      {
        q: 'Can I target a specific US city?',
        a: 'The US pool exits across major metros. You control country and rotation from the URL; contact support if a workflow needs a specific regional footprint.',
      },
      {
        q: 'How much do USA mobile proxies cost?',
        a: 'Pricing is pay-per-GB and starts at $5/GB at higher volumes, with no subscription. Unused data never expires and your key stops at zero — no overage fees.',
      },
    ],
  },
  {
    code: 'de',
    slug: 'germany',
    name: 'Germany',
    shortName: 'Germany',
    flag: '\u{1F1E9}\u{1F1EA}',
    capital: 'Berlin',
    carriers: ['Vodafone', 'Deutsche Telekom', 'O2'],
    title: 'Buy Germany Mobile Proxies — Real Vodafone & Telekom 4G/5G IPs | ProxyMobile',
    description:
      'German mobile proxies on real Vodafone, Deutsche Telekom and O2 4G/5G IPs. Pay per GB from $5/GB, no signup, instant activation. HTTP & SOCKS5, GDPR-conscious.',
    h1: 'Germany Mobile Proxies — Real Vodafone, Telekom & O2 4G/5G IPs',
    intro:
      'Our Germany pool exits through real Vodafone DE, Deutsche Telekom and O2 SIM cards — carrier IPs indistinguishable from a phone on the U-Bahn in Berlin or Munich. German platforms are notoriously strict with automated traffic, so a genuine Telekom or Vodafone address is often the difference between a clean session and an instant block.',
    sections: [
      {
        heading: 'German carriers, German trust signals',
        body: 'Deutsche Telekom and Vodafone operate the ASNs that German fraud systems treat as native consumer traffic. Because carrier-grade NAT puts thousands of real Vodafone customers behind each IP, these addresses are effectively unbannable without collateral damage. That makes German mobile proxies the pragmatic choice for e-commerce research on Otto, Zalando and Amazon.de, where datacenter ranges are filtered aggressively.',
      },
      {
        heading: 'Built for the German market',
        body: 'Localized pricing, German-language creatives and regional stock levels only surface when a site believes you are a real domestic visitor. A Telekom exit renders the .de experience the way a customer in Hamburg or Cologne actually sees it — correct VAT, correct availability, correct promotions — so your data reflects the live German storefront rather than a geofenced fallback.',
      },
      {
        heading: 'Sessions, rotation and privacy',
        body: 'Hold one carrier IP for a full checkout flow with sticky sessions, or hard-rotate for broad price monitoring. We log bandwidth for billing only — never the contents of your traffic or the URLs you visit — which keeps your German workflows clean. Swap to the German residential pool or another country by editing a couple of characters in the same proxy URL.',
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
        a: 'Exits use real SIM cards on Vodafone Germany, Deutsche Telekom and O2 in physical 4G/5G modems — the same carrier IPs a German phone receives.',
      },
      {
        q: 'Are German mobile proxies good for .de e-commerce?',
        a: 'Yes. Carrier IPs are treated as native domestic traffic, so German retail sites serve real localized pricing, stock and promotions instead of blocking or geofencing you.',
      },
      {
        q: 'Do you log my traffic?',
        a: 'We track bandwidth for billing only. We do not log the content of your proxy traffic or the URLs you visit.',
      },
    ],
  },
  {
    code: 'gb',
    slug: 'uk',
    name: 'United Kingdom',
    shortName: 'UK',
    flag: '\u{1F1EC}\u{1F1E7}',
    capital: 'London',
    carriers: ['EE', 'O2', 'Vodafone', 'Three'],
    title: 'Buy UK Mobile Proxies — Real EE, O2 & Vodafone 4G/5G IPs | ProxyMobile',
    description:
      'UK mobile proxies on real EE, O2, Vodafone and Three 4G/5G IPs. Pay per GB from $5/GB, no signup, instant activation. HTTP & SOCKS5, British carrier addresses.',
    h1: 'UK Mobile Proxies — Real EE, O2, Vodafone & Three 4G/5G IPs',
    intro:
      'Our United Kingdom pool routes through real EE, O2, Vodafone UK and Three SIM cards — British carrier IPs identical to a handset on a London commute. UK platforms lean heavily on IP reputation, so an EE or O2 address sails past the reputation checks that shut out datacenter and recycled residential ranges.',
    sections: [
      {
        heading: 'British carrier IPs with genuine reputation',
        body: 'EE and Vodafone run the mobile ASNs that UK anti-fraud stacks recognise as ordinary consumer traffic. With carrier NAT stacking thousands of real subscribers behind each address, these IPs stay clean through workloads that would burn a datacenter range in minutes. That reliability is why UK mobile proxies suit account management, retail research and social automation across British targets.',
      },
      {
        heading: 'See the UK internet as a UK user',
        body: 'Sterling pricing, click-and-collect availability and region-locked streaming catalogues only appear when a site trusts your location. A genuine British carrier exit renders ASOS, Argos and the major grocers exactly as a shopper in Manchester or Glasgow sees them — accurate stock, accurate delivery windows, accurate promotions.',
      },
      {
        heading: 'Rotation control for UK workflows',
        body: 'Sticky mode holds a single EE IP across a multi-step journey; auto-rotate refreshes every ten or thirty minutes; hard-rotate hands you a new British IP per request. Spin up parallel UK sessions with unique session IDs, no API glue required. Country and rotation both live in the URL, so moving between UK mobile and residential is instant.',
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
        a: 'Exits come from real SIM cards on EE, O2, Vodafone UK and Three in physical 4G/5G modems — the same carrier IPs a British phone receives.',
      },
      {
        q: 'Will UK sites treat these as domestic visitors?',
        a: 'Yes. British carrier IPs are seen as native consumer traffic, so UK retail and streaming sites serve real localized pricing, stock and catalogues.',
      },
      {
        q: 'What does it cost to start?',
        a: 'Pay-per-GB from $5/GB at volume, no subscription. Your key stops at zero with no overage fees and unused data never expires.',
      },
    ],
  },
  {
    code: 'fr',
    slug: 'france',
    name: 'France',
    shortName: 'France',
    flag: '\u{1F1EB}\u{1F1F7}',
    capital: 'Paris',
    carriers: ['Orange', 'SFR', 'Bouygues Telecom', 'Free Mobile'],
    title: 'Buy France Mobile Proxies — Real Orange & SFR 4G/5G IPs | ProxyMobile',
    description:
      'French mobile proxies on real Orange, SFR, Bouygues and Free Mobile 4G/5G IPs. Pay per GB from $5/GB, no signup, instant activation. HTTP & SOCKS5.',
    h1: 'France Mobile Proxies — Real Orange, SFR, Bouygues & Free 4G/5G IPs',
    intro:
      'Our France pool exits through real Orange, SFR, Bouygues Telecom and Free Mobile SIM cards — carrier IPs identical to a phone on the Paris Métro. French platforms filter foreign and datacenter traffic aggressively, so a native Orange or SFR address is what keeps your sessions on French sites stable.',
    sections: [
      {
        heading: 'Orange and SFR carrier trust',
        body: 'Orange operates one of the most trusted mobile ASNs in France, and French fraud systems treat its ranges as ordinary consumer traffic. Because carrier NAT places thousands of real abonnés behind each IP, an Orange address cannot be blocked without hitting genuine customers — which is precisely why French mobile proxies hold up on Leboncoin, Vinted and the .fr retail estate where cheaper IP classes get filtered.',
      },
      {
        heading: 'The French market, rendered natively',
        body: 'Euro pricing, French-language creative and France-only availability only appear when a site is confident you are browsing from within the country. A genuine French carrier exit shows the .fr storefront as a shopper in Lyon or Marseille sees it — correct TVA, correct stock, correct regional promotions — so your collected data matches the live French experience.',
      },
      {
        heading: 'Flexible rotation for French targets',
        body: 'Keep one SFR IP pinned through a checkout with sticky mode, or hard-rotate for large-scale price and listing monitoring. Parallel French sessions each get their own IP via unique session IDs — no session dashboard, no API. Country and rotation both sit in the URL, so switching between French mobile and residential exits takes seconds.',
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
        a: 'Exits use real SIM cards on Orange, SFR, Bouygues Telecom and Free Mobile in physical 4G/5G modems — the same carrier IPs a French phone receives.',
      },
      {
        q: 'Are these good for .fr classifieds and retail?',
        a: 'Yes. French carrier IPs read as native consumer traffic, so sites like Leboncoin, Vinted and .fr retailers serve real localized content instead of blocking you.',
      },
      {
        q: 'How is billing handled?',
        a: 'Pay-per-GB from $5/GB at volume with no subscription. Unused data never expires and there are no overage fees.',
      },
    ],
  },
  {
    code: 'es',
    slug: 'spain',
    name: 'Spain',
    shortName: 'Spain',
    flag: '\u{1F1EA}\u{1F1F8}',
    capital: 'Madrid',
    carriers: ['Movistar', 'Orange', 'Vodafone'],
    title: 'Buy Spain Mobile Proxies — Real Movistar & Orange 4G/5G IPs | ProxyMobile',
    description:
      'Spanish mobile proxies on real Movistar, Orange and Vodafone 4G/5G IPs. Pay per GB from $5/GB, no signup, instant activation. HTTP & SOCKS5, native ES carrier IPs.',
    h1: 'Spain Mobile Proxies — Real Movistar, Orange & Vodafone 4G/5G IPs',
    intro:
      'Our Spain pool routes through real Movistar, Orange ES and Vodafone Spain SIM cards — carrier IPs indistinguishable from a phone in Madrid or Barcelona. Spanish platforms weight mobile ASNs heavily, so a genuine Movistar address clears the reputation checks that block datacenter and recycled residential traffic.',
    sections: [
      {
        heading: 'Movistar-grade carrier reputation',
        body: 'Movistar runs the incumbent mobile network in Spain, and its ranges register as native consumer traffic to Spanish fraud systems. Carrier NAT stacks thousands of real users behind each IP, so these addresses stay usable through workloads that would exhaust a datacenter pool. That durability is what makes Spanish mobile proxies effective for Wallapop, Vinted ES and .es retail research.',
      },
      {
        heading: 'A native Spanish storefront',
        body: 'Euro pricing, Castilian-language creative and Spain-only promotions only render when a site trusts your origin. A real Spanish carrier exit shows El Corte Inglés, PcComponentes and the marketplaces exactly as a shopper in Valencia or Seville sees them — correct IVA, correct stock, correct offers — so your data reflects the live Spanish market.',
      },
      {
        heading: 'Rotation and parallel sessions',
        body: 'Pin one Orange ES IP for a login flow with sticky mode, or cycle fresh Spanish carrier IPs per request for wide monitoring. Run many concurrent Spanish sessions, each on its own IP, using unique session IDs — no API required. Country and rotation live in the URL, so moving between Spanish mobile and residential is a two-character edit.',
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
        a: 'Exits use real SIM cards on Movistar, Orange Spain and Vodafone Spain in physical 4G/5G modems — the same carrier IPs a Spanish phone receives.',
      },
      {
        q: 'Do Spanish sites serve local content on these IPs?',
        a: 'Yes. Spanish carrier IPs read as native traffic, so .es retailers and marketplaces serve real localized pricing, stock and promotions.',
      },
      {
        q: 'What is the starting price?',
        a: 'Pay-per-GB from $5/GB at volume with no subscription. Unused data never expires and your key simply stops at zero.',
      },
    ],
  },
  {
    code: 'pl',
    slug: 'poland',
    name: 'Poland',
    shortName: 'Poland',
    flag: '\u{1F1F5}\u{1F1F1}',
    capital: 'Warsaw',
    carriers: ['Orange', 'Play', 'Plus', 'T-Mobile'],
    title: 'Buy Poland Mobile Proxies — Real Orange & Play 4G/5G IPs | ProxyMobile',
    description:
      'Polish mobile proxies on real Orange, Play, Plus and T-Mobile 4G/5G IPs. Pay per GB from $5/GB, no signup, instant activation. HTTP & SOCKS5, native PL carrier IPs.',
    h1: 'Poland Mobile Proxies — Real Orange, Play, Plus & T-Mobile 4G/5G IPs',
    intro:
      'Our Poland pool exits through real Orange PL, Play, Plus and T-Mobile Poland SIM cards — carrier IPs identical to a phone in Warsaw or Kraków. Poland is one of Europe’s fastest-growing e-commerce markets, and its platforms trust domestic carrier traffic far more than any datacenter range.',
    sections: [
      {
        heading: 'Polish carrier IPs that platforms trust',
        body: 'Play and Orange PL operate the mobile ASNs that Polish fraud systems treat as ordinary consumer traffic. Carrier NAT places thousands of real subscribers behind each address, so these IPs remain usable through demanding workloads. That reliability makes Polish mobile proxies a strong fit for Allegro, OLX and the .pl retail ecosystem where cheaper IPs are filtered on sight.',
      },
      {
        heading: 'Built for the Allegro-driven market',
        body: 'Złoty pricing, Polish-language listings and Poland-only availability only surface when a site believes you are browsing domestically. A genuine Polish carrier exit renders Allegro and the major retailers the way a shopper in Wrocław or Gdańsk sees them — correct pricing, correct stock, correct promotions — so your monitoring data matches the live Polish storefront.',
      },
      {
        heading: 'Rotation and sessions for PL targets',
        body: 'Hold one Play IP for the length of a session with sticky mode, or hard-rotate for broad listing collection across Allegro and OLX. Parallel Polish sessions each receive their own IP through unique session IDs, no API required. Because country and rotation both live in the URL, switching between Polish mobile and residential exits is instant.',
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
        a: 'Exits use real SIM cards on Orange Poland, Play, Plus and T-Mobile Poland in physical 4G/5G modems — the same carrier IPs a Polish phone receives.',
      },
      {
        q: 'Are these good for Allegro and OLX?',
        a: 'Yes. Polish carrier IPs read as native consumer traffic, so Allegro, OLX and .pl retailers serve real localized listings and pricing.',
      },
      {
        q: 'How much do Poland mobile proxies cost?',
        a: 'Pay-per-GB from $5/GB at volume with no subscription. Unused data never expires and there are no overage fees.',
      },
    ],
  },
  {
    code: 'ch',
    slug: 'switzerland',
    name: 'Switzerland',
    shortName: 'Switzerland',
    flag: '\u{1F1E8}\u{1F1ED}',
    capital: 'Bern',
    carriers: ['Swisscom', 'Sunrise', 'Salt'],
    title: 'Buy Switzerland Mobile Proxies — Real Swisscom & Sunrise 4G/5G IPs | ProxyMobile',
    description:
      'Swiss mobile proxies on real Swisscom, Sunrise and Salt 4G/5G IPs. Pay per GB from $5/GB, no signup, instant activation. HTTP & SOCKS5, native CH carrier addresses.',
    h1: 'Switzerland Mobile Proxies — Real Swisscom, Sunrise & Salt 4G/5G IPs',
    intro:
      'Our Switzerland pool routes through real Swisscom, Sunrise and Salt SIM cards — carrier IPs identical to a phone in Zürich or Geneva. Switzerland is a small, high-value market where sites are quick to geofence, so a native Swiss carrier address is often the only way to see the domestic experience.',
    sections: [
      {
        heading: 'Swisscom-grade trust in a tightly gated market',
        body: 'Swisscom operates the incumbent Swiss network, and its ranges are treated as native consumer traffic by Swiss platforms. With carrier NAT placing many real subscribers behind each IP, Swiss mobile addresses stay clean where datacenter ranges are blocked immediately. Because the Swiss market is compact and premium, that carrier trust is disproportionately valuable for research and verification.',
      },
      {
        heading: 'The Swiss storefront, three languages deep',
        body: 'CHF pricing, German-, French- or Italian-language creative and Switzerland-only availability only render for trusted domestic visitors. A genuine Swiss carrier exit shows Digitec, Galaxus and the retailers the way a shopper in Basel or Lausanne sees them — correct pricing, correct stock, correct regional promotions — so your data reflects the real Swiss market rather than a geofenced fallback.',
      },
      {
        heading: 'Rotation for a premium market',
        body: 'Sticky mode pins one Swisscom IP through a checkout; auto-rotate refreshes on a timer; hard-rotate cycles per request for broader collection. Parallel Swiss sessions each get their own IP via unique session IDs. Country and rotation both live in the URL, so switching between Swiss mobile and residential exits is instant.',
      },
    ],
    useCases: [
      'Price and availability checks on Swiss retail',
      'Ad verification for CH campaigns',
      'Managing Swiss marketplace accounts',
      'Localized multi-language .ch QA',
    ],
    faqs: [
      {
        q: 'Which Swiss carriers are in the pool?',
        a: 'Exits use real SIM cards on Swisscom, Sunrise and Salt in physical 4G/5G modems — the same carrier IPs a Swiss phone receives.',
      },
      {
        q: 'Do Swiss sites geofence these IPs?',
        a: 'No. Swiss carrier IPs read as native domestic traffic, so .ch retailers serve real localized pricing and stock instead of a geofenced fallback.',
      },
      {
        q: 'What does it cost to start?',
        a: 'Pay-per-GB from $5/GB at volume with no subscription. Unused data never expires and your key stops at zero.',
      },
    ],
  },
  {
    code: 'pa',
    slug: 'panama',
    name: 'Panama',
    shortName: 'Panama',
    flag: '\u{1F1F5}\u{1F1E6}',
    capital: 'Panama City',
    carriers: ['+Móvil (Cable & Wireless)', 'Tigo'],
    title: 'Buy Panama Mobile Proxies — Real +Móvil & Tigo 4G/LTE IPs | ProxyMobile',
    description:
      'Panama mobile proxies on real +Móvil and Tigo 4G/LTE carrier IPs. Pay per GB from $5/GB, no signup, instant activation. HTTP & SOCKS5, native PA addresses.',
    h1: 'Panama Mobile Proxies — Real +Móvil & Tigo 4G/LTE IPs',
    intro:
      'Our Panama pool exits through real +Móvil (Cable & Wireless) and Tigo SIM cards — carrier IPs identical to a phone in Panama City. Latin American carrier IPs are scarce in most proxy networks, so genuine Panamanian mobile addresses give you access to a market that datacenter ranges simply cannot reach cleanly.',
    sections: [
      {
        heading: 'Scarce Panamanian carrier IPs',
        body: 'Few networks carry real Panamanian mobile IPs, which makes +Móvil and Tigo exits genuinely differentiated. Panamanian platforms and regional services see these ranges as ordinary consumer traffic, and carrier NAT keeps many subscribers behind each address — so the IPs stay usable where a datacenter range from a foreign country would be filtered or geoblocked outright.',
      },
      {
        heading: 'Reaching the Panamanian market',
        body: 'Balboa/USD pricing, Spanish-language creative and Panama-only availability only appear for trusted local visitors. A genuine Panamanian carrier exit renders regional retail and service portals the way a user in Panama City actually sees them — correct pricing, correct availability, correct promotions — which is essential for localized research in a market that is otherwise hard to observe.',
      },
      {
        heading: 'Rotation and sessions',
        body: 'Sticky mode holds one +Móvil IP through a session; hard-rotate cycles per request for broader collection. Parallel Panamanian sessions each get their own IP through unique session IDs, with no API to manage. Country and rotation both live in the URL, so switching between Panamanian mobile and residential exits is instant.',
      },
    ],
    useCases: [
      'Localized research in a hard-to-reach LATAM market',
      'Ad verification for Panama-targeted campaigns',
      'Managing regional accounts and services',
      'Availability checks on Panamanian portals',
    ],
    faqs: [
      {
        q: 'Which Panamanian carriers are in the pool?',
        a: 'Exits use real SIM cards on +Móvil (Cable & Wireless) and Tigo in physical 4G/LTE modems — the same carrier IPs a Panamanian phone receives.',
      },
      {
        q: 'Why use Panama mobile proxies specifically?',
        a: 'Genuine Panamanian carrier IPs are scarce in most networks. They read as native traffic, so local sites serve real content instead of geoblocking foreign datacenter ranges.',
      },
      {
        q: 'How is billing handled?',
        a: 'Pay-per-GB from $5/GB at volume with no subscription. Unused data never expires and there are no overage fees.',
      },
    ],
  },
  {
    code: 'am',
    slug: 'armenia',
    name: 'Armenia',
    shortName: 'Armenia',
    flag: '\u{1F1E6}\u{1F1F2}',
    capital: 'Yerevan',
    carriers: ['Team (Ucom)', 'Viva-MTS', 'Beeline'],
    title: 'Buy Armenia Mobile Proxies — Real Team & Viva-MTS 4G/LTE IPs | ProxyMobile',
    description:
      'Armenia mobile proxies on real Team, Viva-MTS and Beeline 4G/LTE carrier IPs. Pay per GB from $5/GB, no signup, instant activation. HTTP & SOCKS5, native AM addresses.',
    h1: 'Armenia Mobile Proxies — Real Team, Viva-MTS & Beeline 4G/LTE IPs',
    intro:
      'Our Armenia pool routes through real Team (Ucom), Viva-MTS and Beeline SIM cards — carrier IPs identical to a phone in Yerevan. Armenian mobile IPs are a rarity in commercial proxy networks, so these exits open up a Caucasus market that is almost impossible to reach convincingly with datacenter ranges.',
    sections: [
      {
        heading: 'Rare Armenian carrier IPs',
        body: 'Viva-MTS and Team operate the mobile networks that Armenian platforms recognise as native consumer traffic. Because so few providers carry genuine Armenian mobile IPs, these exits are hard to fingerprint as proxy traffic, and carrier NAT keeps many real subscribers behind each address — so they remain usable where a foreign datacenter IP is blocked or geofenced immediately.',
      },
      {
        heading: 'Observing the Armenian market',
        body: 'Dram pricing, Armenian-language creative and Armenia-only availability only render for trusted local visitors. A genuine Armenian carrier exit shows regional retail and service portals the way a user in Yerevan or Gyumri sees them — correct pricing, correct availability, correct promotions — which is essential for any research or verification aimed at the Armenian market.',
      },
      {
        heading: 'Rotation and parallel sessions',
        body: 'Sticky mode pins one Viva-MTS IP through a session; hard-rotate cycles per request for wider collection. Run parallel Armenian sessions, each on its own IP, using unique session IDs — no API needed. Country and rotation both live in the URL, so switching between Armenian mobile and residential exits takes seconds.',
      },
    ],
    useCases: [
      'Localized research in an underserved Caucasus market',
      'Ad verification for Armenia-targeted campaigns',
      'Managing regional accounts and services',
      'Availability and pricing checks on Armenian portals',
    ],
    faqs: [
      {
        q: 'Which Armenian carriers are in the pool?',
        a: 'Exits use real SIM cards on Team (Ucom), Viva-MTS and Beeline in physical 4G/LTE modems — the same carrier IPs an Armenian phone receives.',
      },
      {
        q: 'Why are Armenia mobile proxies useful?',
        a: 'Genuine Armenian carrier IPs are rare in most networks. They read as native traffic, so Armenian sites serve real content instead of geoblocking foreign datacenter ranges.',
      },
      {
        q: 'What is the starting price?',
        a: 'Pay-per-GB from $5/GB at volume with no subscription. Unused data never expires and your key simply stops at zero.',
      },
    ],
  },
];

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
