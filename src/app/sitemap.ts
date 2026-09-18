import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { COUNTRIES } from '@/lib/countries';
import { USE_CASE_SLUGS } from '@/lib/use-cases';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // hreflang pair for any English page and its /zh twin.
  const pair = (path: string) => ({
    languages: { en: `${SITE_URL}${path}`, 'zh-Hans': `${SITE_URL}/zh${path}`, 'x-default': `${SITE_URL}${path}` },
  });
  const homeAlternates = {
    languages: { en: SITE_URL, 'zh-Hans': `${SITE_URL}/zh`, 'x-default': SITE_URL },
  };

  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1, alternates: homeAlternates },
    { url: `${SITE_URL}/zh`, lastModified: now, changeFrequency: 'weekly', priority: 0.9, alternates: homeAlternates },
    { url: `${SITE_URL}/mobile-proxy-api`, lastModified: now, changeFrequency: 'weekly', priority: 0.9, alternates: pair('/mobile-proxy-api') },
    { url: `${SITE_URL}/zh/mobile-proxy-api`, lastModified: now, changeFrequency: 'weekly', priority: 0.8, alternates: pair('/mobile-proxy-api') },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Intent pages carry the commercial keywords, so they outrank the country
  // set in priority — the country pages are the long tail beneath them.
  const useCaseEntries: MetadataRoute.Sitemap = USE_CASE_SLUGS.flatMap((slug) => [
    { url: `${SITE_URL}/${slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.9, alternates: pair(`/${slug}`) },
    { url: `${SITE_URL}/zh/${slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.8, alternates: pair(`/${slug}`) },
  ]);

  const countryEntries: MetadataRoute.Sitemap = COUNTRIES.flatMap((c) => [
    { url: `${SITE_URL}/mobile-proxies/${c.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.8, alternates: pair(`/mobile-proxies/${c.slug}`) },
    { url: `${SITE_URL}/zh/mobile-proxies/${c.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.7, alternates: pair(`/mobile-proxies/${c.slug}`) },
  ]);

  return [...staticEntries, ...useCaseEntries, ...countryEntries];
}
