import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { COUNTRIES } from '@/lib/countries';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const countryEntries: MetadataRoute.Sitemap = COUNTRIES.map((c) => ({
    url: `${SITE_URL}/mobile-proxies/${c.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticEntries, ...countryEntries];
}
