export const config = {
  brand: {
    name: 'ProxyMobile',
    tagline: 'Premium 4G/5G/LTE mobile proxies. Real devices. One URL.',
    supportEmail: 'support@proxymobile.shop',
    primaryColor: '#6366f1',
    accentColor: '#10b981',
  },
  pricing: [
    { id: 'starter', displayName: 'Starter', gb: 5, priceUsd: 35, durationDays: 30 },
    { id: 'pro', displayName: 'Pro', gb: 25, priceUsd: 150, durationDays: 30 },
    { id: 'scale', displayName: 'Scale', gb: 100, priceUsd: 500, durationDays: 30 },
  ],
  // Marketed countries — must match the codes in src/lib/countries.ts
  // (COUNTRIES). Only countries with sustained real MOBILE stock; the customer
  // dashboard itself offers whatever is live right now.
  countries: ['us', 'gb', 'de', 'fr', 'es', 'it', 'nl', 'pl', 'br', 'mx', 'ge'] as const,
  legal: {
    tosUrl: '/terms',
    privacyUrl: '/privacy',
  },
} as const;

export type PlanId = (typeof config.pricing)[number]['id'];

export function getPlan(id: string) {
  return config.pricing.find((p) => p.id === id) ?? null;
}
