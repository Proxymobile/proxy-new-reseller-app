/**
 * Central SEO constants + helpers.
 *
 * SITE_URL is the canonical production origin. It powers metadataBase,
 * canonical URLs, sitemap entries, robots.txt and JSON-LD `url` fields.
 */
export const SITE_URL = 'https://proxymobile.shop';
export const SITE_NAME = 'ProxyMobile';
export const OG_IMAGE = { width: 1200, height: 630 } as const;

/** Build an absolute URL from a root-relative path. */
export function absoluteUrl(path = '/'): string {
  if (!path.startsWith('/')) path = `/${path}`;
  return `${SITE_URL}${path}`;
}

/** Organization JSON-LD — used on the homepage. */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/logo.png'),
    description:
      'ProxyMobile provides pay-per-GB mobile proxies on real 4G/5G/LTE carrier IPs and a residential pool across 9 countries.',
    email: 'support@proxymobile.shop',
  };
}

/** WebSite JSON-LD — used on the homepage. */
export function webSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
  };
}

/**
 * Product + Offer JSON-LD for the mobile-proxy bandwidth product.
 * `lowPrice` is the best per-GB rate; the offer is a bandwidth product
 * priced from $5/GB and available on demand.
 */
export function productJsonLd(opts?: { name?: string; description?: string; url?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: opts?.name ?? 'Mobile Proxy Bandwidth',
    description:
      opts?.description ??
      'Pay-per-GB mobile proxy bandwidth on real 4G/5G/LTE carrier IPs. HTTP & SOCKS5, on-demand rotation, no subscription.',
    brand: { '@type': 'Brand', name: SITE_NAME },
    url: opts?.url ?? SITE_URL,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: '5.00',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '5.00',
        priceCurrency: 'USD',
        unitCode: 'E34', // UN/CEFACT code for gigabyte
        unitText: 'GB',
      },
      availability: 'https://schema.org/InStock',
      url: opts?.url ?? absoluteUrl('/#pricing'),
    },
  };
}

/** FAQPage JSON-LD from a list of Q/A pairs. */
export function faqPageJsonLd(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/** BreadcrumbList JSON-LD from an ordered list of {name, url}. */
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
