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
| `EMAIL_SERVER_HOST` | SMTP host | (console logging if unset) |
| `EMAIL_SERVER_PORT` | SMTP port | `587` |
| `EMAIL_SERVER_USER` | SMTP username | — |
| `EMAIL_SERVER_PASSWORD` | SMTP password | — |
| `EMAIL_FROM` | Sender email address | — |

## Security Rules

- **NEVER** prefix server secrets with `NEXT_PUBLIC_`
- **NEVER** commit `.env` to git (only `.env.example`)
- Rotate `AUTH_SECRET` → invalidates all sessions
- Rotate `PROXIES_SX_API_KEY` → must update at client.proxies.sx
