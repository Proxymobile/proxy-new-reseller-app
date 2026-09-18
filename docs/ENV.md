# ENV.md

> Environment variables reference. All defined in `.env` (server-side only).

## Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@db:5432/proxy_reseller` |
| `AUTH_SECRET` | NextAuth.js signing secret (32+ hex chars) | `openssl rand -hex 32` |
| `AUTH_URL` | Public app URL | `https://yourdomain.com` |
| `PROXIES_SX_API_KEY` | Reseller API key (server-only, never NEXT_PUBLIC_) | `psx_...` |
| `PROXIES_SX_USERNAME` | Reseller username for proxy URL construction | `myreseller` |
| `STRIPE_SECRET_KEY` | Stripe API key | `sk_live_...` or `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |

## Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (safe for browser) | — |
| `ADMIN_EMAILS` | Comma-separated admin emails | — |
| `ADMIN_COST_PER_GB` | Your provider cost per GB; enables profit and margin in `/admin` | — (profit hidden) |
| `ADMIN_COST_CURRENCY` | `USD` or `EUR`. EUR is converted with the daily ECB rate (frankfurter.dev) | `USD` |
| `ADMIN_EUR_USD_FALLBACK` | EUR→USD rate used only if the live rate can't be fetched | `1.15` |
| `PROXIES_SX_BASE_URL` | Override the Proxies.sx API base URL (staging/tests only) | SDK default |
| `EMAIL_SERVER_HOST` | SMTP host | (console logging if unset) |
| `EMAIL_SERVER_PORT` | SMTP port | `587` |
| `EMAIL_SERVER_USER` | SMTP username | — |
| `EMAIL_SERVER_PASSWORD` | SMTP password | — |
| `EMAIL_FROM` | Sender email address | — |
| `GSC_SERVICE_ACCOUNT_JSON` | Google service-account key JSON (raw or base64) for the SEO tracker | — (SEO panel shows setup notice) |
| `GSC_CLIENT_EMAIL` | Alternative to the JSON above: the service account's email | — |
| `GSC_PRIVATE_KEY` | Alternative to the JSON above: the PEM key (`\n` escapes accepted) | — |
| `GSC_SITE_URL` | Search Console property, exactly as GSC spells it | `sc-domain:<host of SITE_URL>` |
| `SEO_CRON_SECRET` | Bearer token letting a scheduler POST `/api/admin/seo/sync` unattended | — (admin session required) |
| `APP_URL` | Base URL used by `npm run seo:sync` | `https://proxymobile.shop` |

## Security Rules

- **NEVER** prefix server secrets with `NEXT_PUBLIC_`
- **NEVER** commit `.env` to git (only `.env.example`)
- Rotate `AUTH_SECRET` → invalidates all sessions
- Rotate `PROXIES_SX_API_KEY` → must update at client.proxies.sx
- `ADMIN_PASSWORD` is a shared secret that signs the caller in as the *first* admin
  account, so the audit log cannot say who acted. Once named admin logins exist
  (Admin → Admin logins), remove it.
