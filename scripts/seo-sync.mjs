#!/usr/bin/env node
/**
 * Triggers a Search Console sync against a running deployment.
 * Meant for cron — once a day is plenty, since GSC data lags ~2 days.
 *
 *   node --env-file-if-exists=.env scripts/seo-sync.mjs [--days 90]
 *
 * Env:
 *   SEO_CRON_SECRET  shared secret, must match the deployment's
 *   APP_URL          base URL (defaults to https://proxymobile.shop)
 */
function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : null;
}

const secret = process.env.SEO_CRON_SECRET;
const base = (process.env.APP_URL ?? 'https://proxymobile.shop').replace(/\/$/, '');
const days = Number(arg('days') ?? 90);

if (!secret) {
  console.error('SEO_CRON_SECRET is not set — the deployment will reject this request.');
  process.exit(1);
}

const res = await fetch(`${base}/api/admin/seo/sync?days=${days}`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${secret}` },
});

const text = await res.text();
if (!res.ok) {
  console.error(`Sync failed (${res.status}): ${text}`);
  process.exit(1);
}
console.log(text);
