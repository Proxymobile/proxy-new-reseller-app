export const config = {
  brand: {
    name: 'ProxyMobile',
    tagline: 'Premium 4G/5G/LTE mobile proxies. Real devices. One URL.',
    supportEmail: 'support@proxymobile.shop',
    // Live support channel. Keep the handle and the URL in lockstep — the
    // handle is what people read, the URL is what they click.
    supportTelegram: '@proxymobilesupport',
    supportTelegramUrl: 'https://t.me/proxymobilesupport',
    primaryColor: '#6366f1',
    accentColor: '#10b981',
  },
  pricing: [
    { id: 'starter', displayName: 'Starter', gb: 5, priceUsd: 35, durationDays: 30 },
    { id: 'pro', displayName: 'Pro', gb: 25, priceUsd: 150, durationDays: 30 },
    { id: 'scale', displayName: 'Scale', gb: 100, priceUsd: 500, durationDays: 30 },
  ],
  // Single source of truth for offered countries. Must match the codes in
  // src/lib/countries.ts (COUNTRIES). Mobile-strong pools first.
  countries: ['us', 'gb', 'nl', 'pl', 'fr', 'ge', 'de', 'es', 'ch', 'pa', 'am'] as const,
  legal: {
    tosUrl: '/terms',
    privacyUrl: '/privacy',
  },
} as const;

export type PlanId = (typeof config.pricing)[number]['id'];

export function getPlan(id: string) {
  return config.pricing.find((p) => p.id === id) ?? null;
}
