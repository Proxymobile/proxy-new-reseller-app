export const config = {
  brand: {
    name: 'ProxyMobile',
    tagline: 'Premium 4G/5G/LTE mobile proxies. Real devices. One URL.',
    supportEmail: 'support@proxymobile.example',
    primaryColor: '#6366f1',
    accentColor: '#10b981',
  },
  pricing: [
    { id: 'starter', displayName: 'Starter', gb: 5, priceUsd: 35, durationDays: 30 },
    { id: 'pro', displayName: 'Pro', gb: 25, priceUsd: 150, durationDays: 30 },
    { id: 'scale', displayName: 'Scale', gb: 100, priceUsd: 500, durationDays: 30 },
  ],
  countries: ['us', 'de', 'pl', 'fr', 'es', 'gb'] as const,
  legal: {
    tosUrl: '/terms',
    privacyUrl: '/privacy',
  },
} as const;

export type PlanId = (typeof config.pricing)[number]['id'];

export function getPlan(id: string) {
  return config.pricing.find((p) => p.id === id) ?? null;
}
