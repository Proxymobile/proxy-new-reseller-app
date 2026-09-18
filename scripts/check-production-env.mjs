// Validate values without ever printing credentials.
const required = [
  'DATABASE_URL', 'AUTH_SECRET', 'AUTH_URL',
  'PROXIES_SX_API_KEY', 'PROXIES_SX_USERNAME',
  'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
];
const errors = [];
if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && !/^G-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)) {
  errors.push('NEXT_PUBLIC_GA_MEASUREMENT_ID must be a GA4 measurement ID beginning with G-.');
}
for (const name of required) {
  const value = process.env[name]?.trim();
  if (!value || /placeholder|your_.*here|generate-a-random/i.test(value)) {
    errors.push(`${name} must contain a real production value.`);
  }
}
if ((process.env.AUTH_SECRET?.length ?? 0) < 32) {
  errors.push('AUTH_SECRET must be at least 32 characters.');
}
try {
  const url = new URL(process.env.AUTH_URL);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    errors.push('AUTH_URL must be the public HTTPS origin (without a path or credentials).');
  }
} catch {
  errors.push('AUTH_URL must be a valid URL.');
}
try {
  const url = new URL(process.env.DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error();
} catch {
  errors.push('DATABASE_URL must be a PostgreSQL connection URL.');
}
if (errors.length) {
  console.error(`Production configuration failed:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('Production configuration passed.');
  if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
    console.log('Stripe is in test mode; real payments require a live key and matching webhook secret.');
  }
}
